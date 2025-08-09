import random
import re

target_html_file = "カエル - Wikipedia.html"
output_html_file = "output.html"
spin_class_name = "s"
spin_animation_name = "spin"

minimum_spin_time = 300
maximum_spin_time = 2000
spin_variations = 1000
animation_directions = ["normal", "reverse", "alternate", "alternate-reverse"]
spin_images = True

# make random_spins.css
spin_variation_choices = range(0, spin_variations)
with open("random_spins.css", "w", encoding = "UTF-8") as random_spins_css:
    for i in spin_variation_choices:
        random_spins_css.write("." + spin_class_name + str(i) + "{")
        random_number = random.random()
        random_spins_css.write("animation-duration:" + str(int(random_number * (maximum_spin_time - minimum_spin_time) + minimum_spin_time)) + "ms;")
        random_spins_css.write("animation-direction:" + random.choice(animation_directions) + ";")
        random_spins_css.write("}\n")

# make spin_properties.css
spin_properties_base = open("spin_properties_base.css", "r", encoding = "UTF-8").read()
css_replaces = [
    ("spin_properties_base_class", spin_class_name),
    ("spin_properties_base_animation_name", spin_animation_name)
]
for css_replace in css_replaces:
    spin_properties_base = spin_properties_base.replace(css_replace[0], css_replace[1])

with open("spin_properties.css", "w", encoding = "UTF-8") as spin_properties_css:
    spin_properties_css.write(spin_properties_base)

#make index.html
input_html_file = open(target_html_file, "r", encoding="UTF-8").read().split("</head>")

head_css = '<link rel="stylesheet" href="spin_properties.css">\n<link rel="stylesheet" href="random_spins.css">\n'
input_file_head = input_html_file[0] + head_css + "</head>"
input_file_body = input_html_file[1]

if spin_images:
    for image_tag in re.findall("<img.*?>", input_file_body):
        input_file_body = re.subn(image_tag, "<div class=\"" + spin_class_name + " " + spin_class_name + str(random.choice(spin_variation_choices)) + "\">" + image_tag + "</div>", input_file_body, count = 1)[0]

with open(output_html_file, "w", encoding = "UTF-8") as index:
    index.write(input_file_head)
    in_html_tag = False
    for char in input_file_body:
        if char == "<":
            in_html_tag = True
            index.write(char)
            continue
        if char == ">":
            in_html_tag = False
            index.write(char)
            continue
        if in_html_tag:
            index.write(char)
            continue
        if char in ["\n"," ","\t"]:
            index.write(char)
            continue
        index.write("<div class=\"" + spin_class_name + " " + spin_class_name + str(random.choice(spin_variation_choices)) + "\">" + char + "</div>")
