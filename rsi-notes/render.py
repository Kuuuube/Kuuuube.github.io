import comrak

def get_html_head(output_html_path):
    replacements = [
        {"target": r"{page_title}", "replacement": "Kuuube's RSI Notes"},
        {"target": r"{styles}", "replacement": open("./styles.css").read()},
    ]
    head_html = open("./head.html").read()
    for replacement in replacements:
        head_html = head_html.replace(replacement["target"], replacement["replacement"])
    return head_html

def run_replacements(html_string):
    balls_svg = open("./balls.svg").read()
    replacements = [
        {"target": r"{balls_clockwise}", "replacement": "<span class=\"balls-clockwise\">" + balls_svg + "</span>"},
        {"target": r"{balls_counterclockwise}", "replacement": "<span class=\"balls-counterclockwise\">" + balls_svg + "</span>"},
    ]
    for replacement in replacements:
        html_string = html_string.replace(replacement["target"], replacement["replacement"])
    return html_string

def markdown_to_html(markdown_string):
    # https://docs.rs/comrak/latest/comrak/struct.ExtensionOptions.html
    opts = comrak.ExtensionOptions()
    render = comrak.RenderOptions()
    opts.table = True
    opts.header_ids = ""
    render.unsafe_ = True
    return run_replacements(comrak.render_markdown(markdown_string, extension_options = opts, render_options = render))

def render_html_page(output_html_path, markdown_data):
    output_html = ""
    output_html += get_html_head(output_html_path)
    output_html += "<body>\n"
    output_html += markdown_to_html(markdown_data)
    output_html += "</body>\n"
    return output_html

with open("index.html", "w", encoding = "utf8") as output_html:
    output_html.write(render_html_page("../rsi-notes/index.html", open("index.md").read()))
