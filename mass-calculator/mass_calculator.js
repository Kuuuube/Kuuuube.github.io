function round_float(float, decimal_places) {
    const multiplier = Math.pow(10, decimal_places);
    return Math.round(float * multiplier) / multiplier;
}

function calculate_mass() {
    const shape = document.querySelector("#shape_select").value;
    const density_unit = document.querySelector("#density_unit_select").value;
    const size_source_unit = document.querySelector("#dimensions_unit_select").value;
    const result_mass_unit = document.querySelector("#result_unit_select").value;

    const mean_density = convert_to_kilogram_meter_cubed(document.querySelector("#density_selection").value, density_unit);

    let result_mass_kg = 0;
    switch (shape) {
        case "cube": {
            const edge_length = convert_to_meters(document.querySelector("#cube_edge_length").value, size_source_unit);
            const volume_meters = Math.pow(edge_length, 3);
            result_mass_kg = volume_meters * mean_density;
            break;
        }
        case "rectangular_prism": {
            const length = convert_to_meters(document.querySelector("#rectangular_prism_length").value, size_source_unit);
            const width = convert_to_meters(document.querySelector("#rectangular_prism_width").value, size_source_unit);
            const height = convert_to_meters(document.querySelector("#rectangular_prism_height").value, size_source_unit);
            const volume_meters = length * width * height;
            result_mass_kg = volume_meters * mean_density;
            break;
        }
        case "sphere": {
            const diameter = convert_to_meters(document.querySelector("#sphere_diameter").value, size_source_unit);
            const radius = diameter / 2;
            const volume_meters = 4 / 3 * Math.PI * Math.pow(radius, 3);
            result_mass_kg = volume_meters * mean_density;
            break;
        }
        case "spherical_cap": {
            // https://www.1728.org/diamform.htm
            const diameter = convert_to_meters(document.querySelector("#spherical_cap_diameter").value, size_source_unit);
            const radius = diameter / 2;
            const height = convert_to_meters(document.querySelector("#spherical_cap_height").value, size_source_unit);
            const volume_meters = (Math.PI * Math.pow(height, 2) * (3 * radius - height)) / 3;
            result_mass_kg = volume_meters * mean_density;
            break;
        }
        case "ellipsoid": {
            const length = convert_to_meters(document.querySelector("#ellipsoid_length").value, size_source_unit);
            const width = convert_to_meters(document.querySelector("#ellipsoid_width").value, size_source_unit);
            const height = convert_to_meters(document.querySelector("#ellipsoid_height").value, size_source_unit);
            const radius_a = length / 2;
            const radius_b = width / 2;
            const radius_c = height / 2;
            const volume_meters = 4 / 3 * Math.PI * radius_a * radius_b * radius_c;
            result_mass_kg = volume_meters * mean_density;
            break;
        }
        case "cylinder": {
            const diameter = convert_to_meters(document.querySelector("#cylinder_diameter").value, size_source_unit);
            const height = convert_to_meters(document.querySelector("#cylinder_height").value, size_source_unit);
            const radius = diameter / 2;
            const volume_meters = Math.PI * Math.pow(radius, 2) * height;
            result_mass_kg = volume_meters * mean_density;
            break;
        }
        case "triangular_prism": {
            const length = convert_to_meters(document.querySelector("#triangular_prism_length").value, size_source_unit);
            const height = convert_to_meters(document.querySelector("#triangular_prism_height").value, size_source_unit);
            const base_length = convert_to_meters(document.querySelector("#triangular_prism_base_length").value, size_source_unit);
            const volume_meters = 0.5 * length * height * base_length;
            result_mass_kg = volume_meters * mean_density;
            break;
        }
        case "cone": {
            const diameter = convert_to_meters(document.querySelector("#cylinder_diameter").value, size_source_unit);
            const height = convert_to_meters(document.querySelector("#cylinder_height").value, size_source_unit);
            const radius = diameter / 2;
            const volume_meters = (Math.PI * Math.pow(radius, 2) * height) / 3;
            result_mass_kg = volume_meters * mean_density;
            break;
        }
        case "triangular_pyramid": {
            const height = convert_to_meters(document.querySelector("#triangular_pyramid_height").value, size_source_unit);
            const base_length = convert_to_meters(document.querySelector("#triangular_pyramid_base_length").value, size_source_unit);
            const base_height = convert_to_meters(document.querySelector("#triangular_pyramid_base_height").value, size_source_unit);
            const volume_meters = 0.5 * base_length * base_height * height / 3;
            result_mass_kg = volume_meters * mean_density;
            break;
        }
    }

    document.querySelector("#result_mass").textContent = kilograms_to_result(result_mass_kg, result_mass_unit);
}

function convert_to_meters(value, source_unit) {
    switch (source_unit) {
        case "mm":
            return value / 1000;
        case "cm":
            return value / 100;
        case "m":
            return value;
        case "km":
            return value * 1000;
        case "in":
            return value * 0.0254;
        case "ft":
            return value * 0.3048;
        default:
            return 0;
    }
}

function kilograms_to_result(value, target_unit) {
    switch (target_unit) {
        case "mg":
            return value * 1000000;
        case "g":
            return value * 1000;
        case "kg":
            return value;
        case "oz":
            return value * 35.27396;
        case "lb":
            return value * 2.204623;
        default:
            return 0;
    }
}

function kilogram_meter_cubed_to_result(value, target_unit) {
    switch (target_unit) {
        case "g/cm3":
            return value / 1000;
        case "kg/m3":
            return value;
        case "lb/in3":
            return value / 27679.9;
        case "lb/ft3":
            return value / 16;
        case "oz/in3":
            return value / 1730;
        default:
            return 0;
    }
}

function convert_to_kilogram_meter_cubed(value, source_unit) {
    switch (source_unit) {
        case "g/cm3":
            return value * 1000;
        case "kg/m3":
            return value;
        case "lb/in3":
            return value * 27679.9;
        case "lb/ft3":
            return value * 16;
        case "oz/in3":
            return value * 1730;
        default:
            return 0;
    }
}

function show_active_shape_dimensions_select() {
    const active_shape = document.querySelector("#shape_select").value;

    const active_shape_image = document.querySelector("#shape_image");
    active_shape_image.src = "./shape_images/" + active_shape + ".png";
    active_shape_image.alt = active_shape;

    for (const element of document.querySelectorAll(".shape_dimensions_container")) {
        element.hidden = !(element.id === active_shape + "_dimensions");
    }
}

function show_active_material_type_select() {
    const active_material_type = document.querySelector("#material_type_select").value;
    for (const element of document.querySelectorAll(".density_select_container")) {
        element.hidden = !(element.id === active_material_type + "_density_select");
    }
}

function populate_materials_select(select_element, mass_list) {
    const density_unit = document.querySelector("#density_unit_select").value;
    select_element.innerHTML = "";
    for (const material of mass_list) {
        const option_element = document.createElement("option");
        option_element.value = kilogram_meter_cubed_to_result(material.mean_density, density_unit);
        option_element.text = material.material + " (" + round_float(kilogram_meter_cubed_to_result(material.mean_density, density_unit), 5) + density_unit + ")";
        option_element.dataset.material = material.material;
        select_element.add(option_element);
    }
    // Add custom option to switch to when user manually inputs a density
    const option_element = document.createElement("option");
    option_element.value = "custom";
    option_element.text = "Custom";
    option_element.dataset.material = "custom";
    option_element.hidden = true;
    select_element.add(option_element);
}

function populate_material_list() {
    const elements_density_select = document.querySelector("#elements_density_select");
    populate_materials_select(elements_density_select, elements_mass_list);

    const stainless_steels_density_select = document.querySelector("#stainless_steels_density_select");
    populate_materials_select(stainless_steels_density_select, stainless_steels_mass_list);

    const steels_density_select = document.querySelector("#steels_density_select");
    populate_materials_select(steels_density_select, steels_mass_list);

    const human_density_select = document.querySelector("#human_density_select");
    populate_materials_select(human_density_select, human_mass_list);

    const wood_density_select = document.querySelector("#wood_density_select");
    populate_materials_select(wood_density_select, wood_mass_list)

    const mineral_density_select = document.querySelector("#mineral_density_select");
    populate_materials_select(mineral_density_select, mineral_mass_list)
}

function update_density_input() {
    for (const element of document.querySelectorAll(".density_select_container")) {
        if (!element.hidden) {
            document.querySelector("#density_selection").value = element.value;
        }
    }
    calculate_mass();
}

function set_custom_density() {
    for (const element of document.querySelectorAll(".density_select_container")) {
        if (!element.hidden) {
            element.value = "custom";
        }
    }
}

for (const element of document.querySelectorAll(".density_select_container")) {
    element.addEventListener("change", () => {
        update_density_input();
    });
}

document.querySelector("#density_selection").addEventListener("input", () => {
    set_custom_density();
});

document.querySelector("#shape_select").addEventListener("change", (e) => {
    show_active_shape_dimensions_select();
});

document.querySelector("#material_type_select").addEventListener("change", (e) => {
    show_active_material_type_select();
    update_density_input();
});

document.querySelector("#density_unit_select").addEventListener("change", () => {
    let previous_material = "";
    for (const element of document.querySelectorAll(".density_select_container")) {
        if (!element.hidden) {
            previous_material = element.selectedOptions[0].dataset.material;
        }
    }

    populate_material_list();
    if (previous_material === "custom") {
        set_custom_density();
    } else {
        for (const element of document.querySelectorAll(".density_select_container")) {
            if (!element.hidden) {
                for (const option of element.options) {
                    if (option.dataset.material === previous_material) {
                        element.value = "";
                        option.selected = true;
                        break;
                    }
                }
            }
        }
        update_density_input();
    }
})

for (const element of document.querySelectorAll(".updateMassOnChange")) {
    element.addEventListener("input", calculate_mass);
}

show_active_shape_dimensions_select();
calculate_mass();
populate_material_list();