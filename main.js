print = console.log;

const currentLeague = "Settlers";
const classSelectorId = "class-selector";
const passivesSelectorId = "passives-selector";
const flameModifierId = "explicit.stat_1190333629";
const fleshModifierId = "explicit.stat_2460506030";

function removeAllChildren(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

function getSelectedPassives() {
    const passivesSelector = document.getElementById(passivesSelectorId);
    let selectedPassives = [];

    for (let i = 0; i < passivesSelector.elements.length; i++) {
        if (passivesSelector.elements[i].checked === true) {
            selectedPassives.push(passivesSelector.elements[i]);
        }
    }

    return selectedPassives;
}

function populateSearchFilters(filters, passives) {
    passives.forEach(passive => {
        filters.push({
            id: flameModifierId,
            value: {
                option: passive.value,
            },
            disabled: false
        });
    });
}

function calculateTradeURL() {
    let url = "https://pathofexile.com/trade/search/";

    let searchQuery = {
        query: {
            stats: [{
                type: "count",
                value: { min: 1 },
                filters: [],
                disabled: false,
            }]
        },
        sort: {
            price: "asc"
        }
    };

    const selectedPassives = getSelectedPassives();
    selectedPassives.forEach(passive => {
        searchQuery.query.stats[0].filters.push({
            id: flameModifierId,
            value: {
                option: passive.value,
            },
            disabled: false
        });

        searchQuery.query.stats[0].filters.push({
            id: fleshModifierId,
            value: {
                option: passive.value,
            },
            disabled: false
        });
    });

    const searchQueryString = JSON.stringify(searchQuery);
    url += currentLeague + "?q=" + encodeURIComponent(searchQueryString);

    return url;
}

function getPassivesForClass(className, classData) {
    for (let i = 0; i < classData.length; i++) {
        if (classData[i].class.toLowerCase() === className.toLowerCase()) {
            return classData[i].passives;
        }
    }

    return [];
}

function populatePassivesFieldSet(classData) {
    const passivesFieldSet = document.getElementById(passivesSelectorId);
    const className = document.getElementById(classSelectorId).value;
    const classPassives = getPassivesForClass(className, classData);

    if (classPassives.length == 0) {
        reportError("Could not find passives for " + className);
        return;
    }

    removeAllChildren(passivesFieldSet);

    classPassives.forEach(passive => {
        const checkbox = document.createElement("input");
        let passiveDescription = passive.description;
        if (passiveDescription.length === 0) {
            passiveDescription = "Unknown skill description";
        }

        checkbox.type = "checkbox";
        checkbox.id = passive.name;
        checkbox.value = passive.id;
        checkbox.name = passive.name;
        checkbox.title = passiveDescription;

        const passiveLabel = document.createElement("label");
        passiveLabel.htmlFor = passive.name;
        passiveLabel.innerText = passive.name;
        passiveLabel.title = passiveDescription;

        if (passive.id === undefined) {
            const disabledMessage = "Disabled because the passive skill ID is unknown";
            checkbox.disabled = true;
            checkbox.title = disabledMessage;
            passiveLabel.title = disabledMessage;
        }

        passivesFieldSet.appendChild(checkbox);
        passivesFieldSet.appendChild(passiveLabel);
        passivesFieldSet.appendChild(document.createElement("br"));
    });
}

function populateClassDropdown(classData) {
    const classSelector = document.getElementById(classSelectorId);

    removeAllChildren(classSelector);

    classData.forEach(item => {
        const option = document.createElement("option");
        option.value = item.class.toLowerCase();
        option.textContent = item.class;
        classSelector.appendChild(option);
    });
}

async function populateClassesFromYML(filename) {
    try {
        const response = await fetch(filename);
        const yamlText = await response.text();
        const data = jsyaml.load(yamlText);

        return data;
    } catch (error) {
        console.error("Error fetching or parsing the YAML file:", error);
        return [];
    }
}

function reportError(errorMessage) {
    console.error(errorMessage);

    const errorBox = document.getElementById("error-box");
    removeAllChildren(errorBox);

    const errorText = document.createElement("ul");
    errorText.innerText = errorMessage;
    errorBox.appendChild(errorText);
}

async function populatePassives(_) {
    const classData = await populateClassesFromYML("data.yml");
    if (classData.length == 0) {
        reportError("There was an error reading data.");
        return;
    }

    populatePassivesFieldSet(classData);
}

function openLink(_) {
    url = calculateTradeURL();

    window.open(url, "_blank");
}

function resetSelection(_) {
    main()
}

async function main() {
    const classData = await populateClassesFromYML("data.yml");

    if (classData.length == 0) {
        reportError("There was an error reading data.");
        return;
    }

    populateClassDropdown(classData);
    populatePassivesFieldSet(classData);
}

window.onload = main;
