import {
    id, classes, nameGetter, appAddress, studentRoleId, teacherRoleId, adminRoleId,
    validateEmail, validatePassword, logOut, redirectToIndexIfUserIsNotLoggedInAdmin,
    checkIfUserIsLoggedInAndIfItIsAdmin, getAllUsersFromDatabase, enableDisableButton,
    isolateParticularGroupOfUsersFromAllUsers, getAllCoursesFromDatabase, getCourseDetails,
    getStudentsFromStudentsCoursesJunctionTable, getAllItemsFromStudentsCoursesJunctionTable,
    updateCourse, getSectionsAssignedToTheModule, getAllSections, checkIfElementOccursInArrayMoreThanOnce
} from './general-script.js';
window.onload = (async function () {
    await addSectionDisplayManager();
})
async function addSectionDisplayManager(moduleId = localStorage.getItem("moduleIdToAddSectionTo")) {
    let errorContainer = id("add-section-display-modules-errors");
    let moduleElementResponse = await getParticularModuleData(moduleId);
    if (moduleElementResponse == null) {
        errorContainer.textContent = "Problem z połączeniem z serwerem";
        return;
    }

    let moduleElementJson = await moduleElementResponse.json();

    let moduleElement = moduleElementJson.data;
    // console.log(moduleElement["name"]);


    let pageNameEl = id("add-section-page-name");
    pageNameEl.textContent = `Moduł: ${moduleElement["name"]}`;

    let thisModulesLastSectionId = await getLastSectionIdOrOrderNumber(moduleId, "id");
    let newSectionId;
    thisModulesLastSectionId > 0 ? newSectionId = thisModulesLastSectionId + 1 : newSectionId = 0;

    let newSectionOrderNumber;
    let thisModulesLastSectionOrderNumber = await getLastSectionIdOrOrderNumber(moduleId, "order_number");
    thisModulesLastSectionOrderNumber > 0 ? newSectionOrderNumber = thisModulesLastSectionOrderNumber + 1 : newSectionOrderNumber = 0;

    await enableToAddManyFileAndTextElements(moduleId, newSectionId, newSectionOrderNumber, errorContainer);
}
async function enableToAddManyFileAndTextElements(moduleId, newSectionId, newSectionOrderNumber, errorContainer) {

    let sectionName = id("add-section-name");
    let buttonToAddTextElement = id("add-section-add-text-element-button");
    let buttonToAddFileElement = id("add-section-add-file-element-button");
    let submitButton = id("add-section-submit");
    let elementId = 1;
    let selects = document.querySelectorAll(".add-section-add-text-element-selects");

    let filesInputs = document.querySelectorAll(".add-section-add-file-element-input");
    // console.log(selects.length);

    buttonToAddTextElement.addEventListener('click', function (e) {
        e.preventDefault();
        let textDivsForInput = document.querySelectorAll(".add-section-add-text-element-div-for-input");
        let selects = document.querySelectorAll(".add-section-add-text-element-selects");
        if (textDivsForInput.length == 0 && selects.length < 10) {
            displayOptionToAddTextElement(newSectionId, true, errorContainer);
            updateAllSelects();
        }
    });
    buttonToAddFileElement.addEventListener('click', function (e) {
        e.preventDefault();
        let filesInputs = document.querySelectorAll(".add-section-add-file-element-input");
        let selects = document.querySelectorAll(".add-section-add-text-element-selects");
        if (filesInputs.length == 0 && selects.length < 10) {
            displayOptionToAddFileElement(true, errorContainer);
            updateAllSelects();
        }
    });
    submitButton.addEventListener('click', async function (e) {
        e.preventDefault();
        await addSectionManager(errorContainer);
    })
}
function displayOptionToAddFileElement(firstFileInput, errorContainer) {
    errorContainer.textContent = '';
    let filesInputs = document.querySelectorAll(".add-section-add-file-element-input");
    let lastFileInputsIdNumber = getLastSelectNumberOrLastFileInputNumber(filesInputs);

    let divToStoreFileInput = document.createElement('div');
    divToStoreFileInput.setAttribute('id', `add-section-add-file-element-div-${lastFileInputsIdNumber + 1}`);
    divToStoreFileInput.setAttribute('class', `add-section-add-file-element-div-for-file-input`);

    let containerForFileInput = id("add-section-add-file-element-display");

    let selects = document.querySelectorAll(".add-section-add-text-element-selects");
    // console.log(selects);
    let lastSelectNumber = getLastSelectNumberOrLastFileInputNumber(selects);
    let selectForElementOrderNumber = document.createElement('select');
    selectForElementOrderNumber.setAttribute('id', `add-section-select-${lastSelectNumber + 1}`);
    selectForElementOrderNumber.setAttribute('class', `add-section-add-text-element-selects`);

    let inputFilePlace = document.createElement('input');
    inputFilePlace.setAttribute('id', `add-section-add-file-element-input-${lastFileInputsIdNumber + 1}`);
    inputFilePlace.setAttribute('type', 'file');
    inputFilePlace.setAttribute('class', 'add-section-add-file-element-input');

    let buttonToAddAnotherFile;

    if (firstFileInput) {
        buttonToAddAnotherFile = document.createElement("button");
        buttonToAddAnotherFile.setAttribute("id", `add-section-button-to-add-another-select-${lastFileInputsIdNumber + 1}`);
        buttonToAddAnotherFile.setAttribute("class", "btn btn-success");
        buttonToAddAnotherFile.textContent = "[+] dodaj kolejny";
        buttonToAddAnotherFile.addEventListener('click', function (e) {
            e.preventDefault();
            let selects = document.querySelectorAll(".add-section-add-text-element-selects");
            if (selects.length < 10) {
                displayOptionToAddFileElement(false, errorContainer);
                updateAllSelects();
            }
            else {
                errorContainer.textContent = "Nie można dodać więcej niż 10 elementów jednocześnie";
            }

        });
    }
    let buttonToDeleteFileElement = document.createElement("button");
    buttonToDeleteFileElement.setAttribute("id", `add-section-button-to-delete-file-element-${lastFileInputsIdNumber + 1}`);
    buttonToDeleteFileElement.setAttribute("class", "btn btn-danger");
    buttonToDeleteFileElement.textContent = "X";
    buttonToDeleteFileElement.addEventListener('click', function (e) {
        e.preventDefault();
        // console.log(buttonToDeleteFileElement.getAttribute("id"));
        deleteOptionToAddTextOrFileElement(buttonToDeleteFileElement.getAttribute("id"), "file");
        updateAllSelects();
        errorContainer.textContent = '';

    });
    divToStoreFileInput.appendChild(selectForElementOrderNumber);
    divToStoreFileInput.appendChild(inputFilePlace);

    divToStoreFileInput.appendChild(buttonToDeleteFileElement);
    if (buttonToAddAnotherFile) divToStoreFileInput.appendChild(buttonToAddAnotherFile);
    containerForFileInput.appendChild(divToStoreFileInput);
}
function displayOptionToAddTextElement(newSectionId, firstSelect, errorContainer) {
    errorContainer.textContent = '';
    let selects = document.querySelectorAll(".add-section-add-text-element-selects");
    let lastSelectNumber = getLastSelectNumberOrLastFileInputNumber(selects);
    let divToStoreInput = document.createElement('div');
    divToStoreInput.setAttribute('id', `add-section-add-text-element-div-${lastSelectNumber + 1}`);
    divToStoreInput.setAttribute('class', `add-section-add-text-element-div-for-input`);

    let selectForElementOrderNumber = document.createElement('select');
    selectForElementOrderNumber.setAttribute('id', `add-section-select-${lastSelectNumber + 1}`);
    selectForElementOrderNumber.setAttribute('class', `add-section-add-text-element-selects`);


    let containerForInput = id("add-section-add-text-element-display");
    let inputPlace = document.createElement("input");
    inputPlace.setAttribute("type", "textArea");
    inputPlace.setAttribute("required", "");
    inputPlace.setAttribute("placeholder", "Element tekstowy...");
    inputPlace.setAttribute('id', `add-section-text-input-${lastSelectNumber + 1}`);

    let buttonToAddAnotherSelect;
    if (firstSelect) {
        buttonToAddAnotherSelect = document.createElement("button");
        buttonToAddAnotherSelect.setAttribute("id", `add-section-button-to-add-another-select-${lastSelectNumber + 1}`);
        buttonToAddAnotherSelect.setAttribute("class", "btn btn-success");
        buttonToAddAnotherSelect.textContent = "[+] dodaj kolejny";
        buttonToAddAnotherSelect.addEventListener('click', function (e) {
            e.preventDefault();
            let selects = document.querySelectorAll(".add-section-add-text-element-selects");
            if (selects.length < 10) {
                displayOptionToAddTextElement(newSectionId, false, errorContainer);
                updateAllSelects();
            }
            else {
                errorContainer.textContent = "Nie można dodać więcej niż 10 ELE jednocześnie";
            }

        });
    }
    let buttonToDeleteTextElement = document.createElement("button");
    buttonToDeleteTextElement.setAttribute("id", `add-section-button-to-delete-text-element-${lastSelectNumber + 1}`);
    buttonToDeleteTextElement.setAttribute("class", "btn btn-danger");
    buttonToDeleteTextElement.textContent = "X";
    buttonToDeleteTextElement.addEventListener('click', function (e) {
        e.preventDefault();
        // console.log(buttonToDeleteTextElement.getAttribute("id"));
        deleteOptionToAddTextOrFileElement(buttonToDeleteTextElement.getAttribute("id"), "text");
        updateAllSelects();
        errorContainer.textContent = '';


    });

    divToStoreInput.appendChild(selectForElementOrderNumber);
    divToStoreInput.appendChild(inputPlace);

    divToStoreInput.appendChild(buttonToDeleteTextElement);
    if (buttonToAddAnotherSelect) divToStoreInput.appendChild(buttonToAddAnotherSelect);
    containerForInput.appendChild(divToStoreInput);
}
function getLastSelectNumberOrLastFileInputNumber(elementsToLookFor) {
    let elementsValues = [...elementsToLookFor].map(element => Number(String(element.id).match(/\d+/g)));
    // console.log(elementsValues);
    let maxNumber = 0;
    for (let i = 0; i < elementsValues.length; i++) {
        if (elementsValues[i] > maxNumber) {
            maxNumber = Number(elementsValues[i]);
        }
    }
    // console.log(maxNumber);
    return maxNumber;
}
function deleteOptionToAddTextOrFileElement(buttonIdWithText, textOrFile) {
    var buttonPureId = Number(String(buttonIdWithText).match(/\d+/g));
    // console.log(buttonPureId);
    if (textOrFile == "text") {
        id(`add-section-add-text-element-div-${buttonPureId}`).remove();
    }
    if (textOrFile == "file") {
        id(`add-section-add-file-element-div-${buttonPureId}`).remove();
    }

    updateAllSelects();
}
Element.prototype.remove = function () {
    this.parentElement.removeChild(this);
}
NodeList.prototype.remove = HTMLCollection.prototype.remove = function () {
    for (var i = this.length - 1; i >= 0; i--) {
        if (this[i] && this[i].parentElement) {
            this[i].parentElement.removeChild(this[i]);
        }
    }
}
function updateAllSelects() {
    let selects = document.querySelectorAll(".add-section-add-text-element-selects");
    // console.log(selects);
    selects.forEach(function (select) {
        select.innerHTML = '';
        // <option value="" disabled selected>Select your option</option>
        let option = document.createElement('option');
        option.setAttribute('value', "");
        option.setAttribute('disabled', '');
        option.setAttribute('selected', '');
        select.appendChild(option);
        option.textContent = "Ustal kolejność";
        for (let i = 1; i <= selects.length; i++) {
            let option = document.createElement('option');
            option.setAttribute('value', i);
            option.textContent = i;
            select.appendChild(option);
        }

    });

}
async function addSectionManager(errorContainer) {
    let allFilesDivs = document.querySelectorAll(".add-section-add-text-element-div-for-input");
    let allTextsDivs = document.querySelectorAll(`.add-section-add-file-element-div-for-file-input`);

    console.log(allFilesDivs);
    console.log(allTextsDivs);

    let selectedOptionsOccurMoreThanOnce = checkIfSelectedOptionsOccurMoreThanOnce(allFilesDivs, allTextsDivs);
    if (selectedOptionsOccurMoreThanOnce) {
        errorContainer.textContent = "Niepoprawna kolejność - każdy element musi mieć unikatowy numer porządkowy!";
        return false;
    }
    errorContainer.textContent = '';
    let elementsToAddToSection = getOrderNumbersAndValuesFromInputs(allFilesDivs, allTextsDivs);

}
function getOrderNumbersAndValuesFromInputs(allFilesDivs, allTextsDivs) {
    let allOrderNumbersAndInputValues = [];
    allFilesDivs.forEach(function (div) {
        let children = div.children;
        let selectsChildren = [...children].filter((element) => element.tagName == "SELECT");
        let fileInputChildren = [...children].filter((element) => element.tagName == "INPUT");
        console.log(selectsChildren);
        console.log(fileInputChildren);
    });
    allTextsDivs.forEach(function (div) {
        let children = div.children;
        let selectsChildren = [...children].filter((element) => element.tagName == "SELECT");
        let textInputChildren = [...children].filter((element) => element.tagName == "INPUT");
        console.log(selectsChildren);
        console.log(textInputChildren);
    });
}
function checkIfSelectedOptionsOccurMoreThanOnce(allFilesDivs, allTextsDivs) {
    // let f = [...elementsToLookFor].map(element => Number(String(element.id).match(/\d+/g)));
    let allSelectsValues = [];
    allFilesDivs.forEach(function (div) {
        let children = div.children;
        let selectsChildren = [...children].filter((element) => element.tagName == "SELECT");
        let selectsValues = [...selectsChildren].map(child => Number(child.value));
        allSelectsValues.push.apply(allSelectsValues, selectsValues);
    });
    allTextsDivs.forEach(function (div) {
        let children = div.children;
        let selectsChildren = [...children].filter((element) => element.tagName == "SELECT");
        let selectsValues = [...selectsChildren].map(child => Number(child.value));
        allSelectsValues.push.apply(allSelectsValues, selectsValues);
    });
    return checkIfElementOccursInArrayMoreThanOnce(allSelectsValues);
}
async function getLastSectionIdOrOrderNumber(moduleId, valueToLookFor) {
    let sectionsAssignedToThisModule = await getSectionsAssignedToTheModule(moduleId);
    let maxNumber = 0;
    for (let i = 0; i < sectionsAssignedToThisModule.length; i++) {
        if (Number(sectionsAssignedToThisModule[i][valueToLookFor]) > maxNumber) {
            maxNumber = Number(sectionsAssignedToThisModule[i][valueToLookFor]);
        }
    }
    return maxNumber;

}
async function getParticularModuleData(moduleId) {
    let response;
    let errorOccured = false;
    let responseNotOkayFound = false;
    try {

        response = await fetch(`${appAddress}/items/Modules/${moduleId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("access_token")}`
            }
        });
        if (!response.ok) responseNotOkayFound = true;

    }
    catch (err) {
        console.error(`${err}`);
        errorOccured = true;
    }
    // console.log(response.statusText);
    if (errorOccured || responseNotOkayFound) return null;
    return response;
}