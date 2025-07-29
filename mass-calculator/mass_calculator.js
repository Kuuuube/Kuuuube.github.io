function calculate_mass() {
    const shape = document.querySelector("#shape_select").value;
    const mean_density = document.querySelector("#density_selection").value;

    const size_source_unit = document.querySelector("#dimensions_unit_select").value;
    const result_mass_unit = document.querySelector("#result_unit_select").value;

    let result_mass_kg = 0;
    switch (shape) {
        case "cube": {
            const side_length = convert_to_meters(document.querySelector("#cube_side_length").value, size_source_unit);
            const volume_meters = Math.pow(side_length, 3);
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

function show_active_shape_dimensions_select() {
    const active_shape = document.querySelector("#shape_select").value;
    for (const element of document.querySelectorAll(".shape_dimensions_container")) {
        element.hidden = !element.id.includes(active_shape);
    }
}

document.querySelector("#density_select").addEventListener("change", (e) => {
    e.target.previousElementSibling.value = e.target.value;
    calculate_mass();
});

document.querySelector("#shape_select").addEventListener("change", (e) => {
    show_active_shape_dimensions_select();
});

for (const element of document.querySelectorAll(".updateMassOnChange")) {
    element.addEventListener("input", calculate_mass);
}

show_active_shape_dimensions_select();
calculate_mass();
