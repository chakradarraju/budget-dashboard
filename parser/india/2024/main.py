from pypdf import PdfReader
import os
import string
import json
import tempfile
import requests

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

def parse_number(str, default):
    return float(str) if is_number(str) else default

def parse_line(line):
    parts = line.split()
    result = {}
    result["label"] = " ".join(parts[1:-4])
    result["subvalue1"] = parse_number(parts[-4], 0)
    result["subvalue2"] = parse_number(parts[-3], 0)
    result["value"] = parse_number(parts[-2], 0)
    return result

def process_pages(pages, reader):
    result = []
    for i in pages:
        process_summary_page(reader.pages[i], result)
    return result

def is_number(val):
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

if __name__ == '__main__':
    reader = check_and_download_pdf('india/2024/allsbe.pdf', 'https://www.indiabudget.gov.in/doc/eb/allsbe.pdf')
    result = process_pages(range(2, 8), reader)
    result = sort_items(result)
    print(json.dumps(with_metadata(result), indent=2))
    
