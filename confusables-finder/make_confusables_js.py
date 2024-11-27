import json

file_lines = list(map(str.strip, open("confusables.txt", "r", encoding="UTF-8").readlines()))

confusables_raw = filter(lambda x: len(x) > 0 and x[0] != "#", file_lines) #remove comments

confusables_dict = {}

for confusable_raw in confusables_raw:
    confusable_split = confusable_raw.split("\t")
    base_character_hex = confusable_split[1][0:-2]
    confusable_hex = confusable_split[0][0:-2]
    if " " in base_character_hex:
        continue
    base_character = chr(int("0x" + base_character_hex, 16))
    confusable = chr(int("0x" + confusable_hex, 16))
    if base_character not in confusables_dict:
        confusables_dict[base_character] = [confusable]
    else:
        confusables_dict[base_character].append(confusable)

with open("confusables.js", "w") as output_file:
    output_file.write("const confusables_dict = ")
    confusables_json_string = json.dumps(confusables_dict)
    output_file.write(("\n" + confusables_json_string + "\n").replace("], ", "],\n    ").replace("\n{", "{\n    ").replace("}\n", "\n}\n"))
