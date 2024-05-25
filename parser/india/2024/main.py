from pypdf import PdfReader
import os
import string
import json
import tempfile
import requests
import sys
import logging

ALLOCATION = "allocation"
DEVELOPMENT_HEADS = "development_heads"
PUBLIC_ENTERPRISES = "public_enterprises"
DEMAND_NO = "DEMAND NO."

def process_summary_page(page, ministries):
    lines = page.extract_text().splitlines()
    for line in lines:
        if is_ministry_line(line):
            parts = line.split()
            ministries.append({
                "label": " ".join(parts[:-3]),
                "value": float(parts[-1]),
                "subitems": []
            })
        elif line.startswith(tuple(string.digits)):
            ministries[-1]["subitems"].append(parse_line(line))

def parse_number(str, default=0):
    return float(str) if is_number(str) else default

def parse_integer(str, default=0):
    return int(str) if is_integer(str) else default

def is_integer(str):
    if str.startswith("-"): str = str[1:]
    return str.isdigit()

def parse_line(line):
    parts = line.split()
    pages = parts[-1].split("-")
    return {
        "index": parts[0].strip('.'),
        "label": " ".join(parts[1:-4]),
        "subvalue1": parse_number(parts[-4]),
        "subvalue2": parse_number(parts[-3]),
        "value": parse_number(parts[-2]),
        "startPage": parse_integer(pages[0]),
        "endPage": parse_integer(pages[1])
    }

def process_pages(pages, reader):
    result = []
    for i in pages:
        process_summary_page(reader.pages[i], result)
    return result

def is_number(val):
    if val.startswith("-"): val = val[1:]
    return val.replace(".", "", 1).isnumeric()

def is_ministry_line(line):
    parts = line.split()
    n_parts = len(parts)
    if n_parts < 3:
        return False
    for i in range(3):
        part = parts[n_parts-1-i]
        if not is_number(part):
            return False
    return True

def print_lines(page_index, reader):
    page = reader.pages[page_index]
    lines = page.extract_text().splitlines()
    print(lines)

def check_and_download_pdf(filename, url):
    # Get the path to the system's temporary directory
    tmp_dir = tempfile.gettempdir()
    # Combine the directory path and filename to get the full path
    file_path = os.path.join(tmp_dir, filename)

    directory = os.path.dirname(file_path)

    os.makedirs(directory, exist_ok=True)
    
    # Check if the file already exists
    if not os.path.exists(file_path):
        print(f"{filename} not found in {tmp_dir}. Downloading from {url}...")
        
        # Send a HTTP GET request to the URL
        response = requests.get(url)
        # Raise an exception if the request was unsuccessful
        response.raise_for_status()
        
        # Write the content of the response to a file in binary mode
        with open(file_path, 'wb') as file:
            file.write(response.content)

    return PdfReader(file_path)      

def sort_items(result):
    for item in result:
        item['subitems'] = sorted(item['subitems'], key=lambda x: x['value'], reverse=True)
    return sorted(result, key=lambda x: x['value'], reverse=True)

def with_metadata(result):
    return {
        "label": "Expenditure Budget 2024-25",
        "sourceUrl": "https://www.indiabudget.gov.in/doc/eb/allsbe.pdf",
        "link": "/india/2024/",
        "schema": {
            "label": "Ministry",
            "value": "Total Expenditure (in cr.)",
            "subitems": {
                "label": "Department",
                "value": "Total",
                "subvalue1": "Revenue",
                "subvalue2": "Capital"
            }
        },
        "data": result
    }

def process_summary(reader):
    result = process_pages(range(2, 8), reader)
    result = sort_items(result)
    return with_metadata(result)

def pretty_print(data):
    return json.dumps(data, indent=2)

def parse_numbers(parts):
    return {
        "revenue": parse_number(parts[-3]),
        "capital": parse_number(parts[-2]),
        "total": parse_number(parts[-1])
    }

def parse_name(data_lines):
    if len(data_lines) == 1:
        parts = data_lines[0].split()
        if is_data_line(data_lines[0]):
            return " ".join(parts[1:-12])
        else:
            return " ".join(parts[1:])
    name = ""
    for (idx, line) in enumerate(data_lines):
        parts = line.split()
        if idx == 0:
            name += " ".join(parts[1:])
        elif idx == len(data_lines) - 1 and len(parts) > 12:
            name += " " + " ".join(parts[:-12])
        else:
            name += " " + " ".join(parts)
    return name

def parse_ministry_line(data_lines, section=False):
    index = data_lines[0].split()[0]
    parts = data_lines[-1].split()
    if not section and len(parts) > 12:
        return {
            "index": index.strip('.'),
            "name": parse_name(data_lines),
            "2024_budget": parse_numbers(parts[-3:]),
            "2023": {
                "budget": parse_numbers(parts[-9:-6]),
                "revised": parse_numbers(parts[-6:-3])
            },
            "2022_actual": parse_numbers(parts[-12:-9])
        }
    else:
        return {
            "index": index,
            "name": parse_name(data_lines)
        }

def is_data_line(line):
    parts = line.split(" ")
    if len(parts) < 12:
        return False
    n = 0
    for part in parts[-12:]:
        if is_number(part):
            n += 1
    return n > 1

def is_last_line(line):
    if not line.startswith(tuple(string.digits)):
        return False
    relevant = line[5:]
    for c in relevant:
        if c in string.digits:
            return False
    return True

def is_sub_section(line, data_lines):
    if len(data_lines) < 1:
        return False
    index = data_lines[0].split()[0]
    return line.startswith(index) and is_data_line(line)

def process_ministry(reader, page_indices):
    parsing_section = None
    ministry = {
        "name": None,
        "demand": None,
        "department": None,
        "sections": {
            ALLOCATION: [],
            DEVELOPMENT_HEADS: [],
            PUBLIC_ENTERPRISES: []
        }
    }
    for page_index in page_indices:
        lines = reader.pages[page_index].extract_text().splitlines()
        if ministry["name"] is None:
            for i in range(10):
                if i + 1 < len(lines) and (DEMAND_NO in lines[i] or "APPROPRIATION" in lines[i]):
                    ministry["name"] = lines[i - 1].strip()
                    ministry["demand"] = lines[i].strip()
                    ministry["department"] = lines[i + 1].strip()
                    if DEMAND_NO in lines[i]:
                        ministry["number"] = parse_integer(lines[i].strip()[len(DEMAND_NO) + 1:])
                    else:
                        str = lines[i].strip()
                        start = str.find("(APPROPRIATION)")
                        ministry["number"] = parse_integer(str[4:start - 1])
        i = 0
        while i < len(lines):
            line = lines[i].strip()
            # print(i, parsing_section, is_last_line(line), line)
            if 'A. The Budget allocations' in line:
                parsing_section = ALLOCATION
            elif 'B. Developmental Heads' in line:
                parsing_section = DEVELOPMENT_HEADS
            elif 'C. Investment in Public Enterprises' in line:
                parsing_section = PUBLIC_ENTERPRISES
            elif parsing_section is not None and line.startswith(tuple(string.digits)):
                data_lines = []
                no_data = False
                is_section = False
                while not is_data_line(line):
                    data_lines.append(line)
                    i += 1
                    if i < len(lines):
                        line = lines[i].strip()
                    else:
                        no_data = True
                        break
                    if is_sub_section(line, data_lines):
                        is_section = True
                        i -= 1
                        break
                if is_section:
                    #print('Inserting section', is_section, data_lines, line)
                    ministry["sections"][parsing_section].append(parse_ministry_line(data_lines, True))
                else:
                    data_lines.append(line)
                    if not no_data:
                        ministry["sections"][parsing_section].append(parse_ministry_line(data_lines))
            elif is_last_line(line):
                parsing_section = None
            i += 1
    return ministry


if __name__ == '__main__':
    reader = check_and_download_pdf('india/2024/allsbe.pdf', 'https://www.indiabudget.gov.in/doc/eb/allsbe.pdf')
    # pretty_print(process_ministry(reader, range(150, 153)))
    # print(reader.pages[150].extract_text())
    data_dir = sys.argv[1]
    summary_file = open(os.path.join(data_dir, 'index.json'), 'w')
    summary = process_summary(reader)
    summary_file.write(pretty_print(summary))
    # index_file = open(os.path.join(data_dir, 'index.json'), 'r')
    # data = json.load(index_file)
    # index_file.close()
    done = False
    for item in summary['data']:
        for subitem in item['subitems']:
            try:
                content = process_ministry(reader, range(subitem['startPage'] + 8, subitem['endPage'] + 9))
            except Exception as e:
                logging.exception('Caught exception processing', subitem, e)
            if 'name' in content:
                try:
                    print('Writing ', content.get('name', ''), content.get('number', ''), content.get('department', ''))
                    filename = os.path.join(data_dir, str(subitem['index']) + '.json')
                    file = open(filename, 'w')
                    file.write(pretty_print(content))
                    file.close()
                except Exception as e:
                    logging.exception('Caught exception writing', subitem, e)
            else:
                print('Invalid data for', subitem)
