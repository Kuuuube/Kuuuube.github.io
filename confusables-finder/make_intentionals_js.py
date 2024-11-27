import json

file_lines = list(map(str.strip, open("intentional.txt", "r", encoding="UTF-8").readlines()))

intentionals_raw = filter(lambda x: len(x) > 0 and x[0] != "#", file_lines) #remove comments

intentionals_dict = {}

for intentional_raw in intentionals_raw:
    intentional_split = intentional_raw.split("\t")
    base_character_hex = intentional_split[0][0:-2]
    intentional_hex = intentional_split[1]
    if " " in base_character_hex:
        continue
    base_character = chr(int("0x" + base_character_hex, 16))
    intentional = chr(int("0x" + intentional_hex, 16))
    if base_character not in intentionals_dict:
        intentionals_dict[base_character] = [intentional]
    else:
        intentionals_dict[base_character].append(intentional)

with open("intentionals.js", "w") as output_file:
    output_file.write("const intentionals_dict = ")
    intentionals_json_string = json.dumps(intentionals_dict)
    output_file.write(("\n" + intentionals_json_string + "\n").replace("], ", "],\n    ").replace("\n{", "{\n    ").replace("}\n", "\n}\n"))
