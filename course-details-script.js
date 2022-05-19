import {
    id, classes, nameGetter, appAddress, studentRoleId, teacherRoleId, adminRoleId,
    validateEmail, validatePassword, logOut, redirectToIndexIfUserIsNotLoggedInAdmin,
    checkIfUserIsLoggedInAndIfItIsAdmin, getAllUsersFromDatabase, enableDisableButton,
    isolateParticularGroupOfUsersFromAllUsers, getAllCoursesFromDatabase, getCourseDetails,
    getStudentsFromStudentsCoursesJunctionTable, getAllItemsFromStudentsCoursesJunctionTable,
    updateCourse
} from './general-script.js';
window.onload = (async function () {
    await displayDetails();
})
async function displayDetails(courseId = localStorage.getItem("courseIdToShowDetails")) {
    let nameElement = id("course-details-course-name");
    let descriptionElement = id("course-details-course-description");
    let maxStudentsCountElement = id("course-details-course-maximum-students-count-span");
    let studentsAttendingElement = id("course-details-number-of-students-attending-course-span");
    let activityStatusElement = id("course-details-activity-status-span");
    let studentsListElement = id("course-details-students-attending-course-list");
    let errorContainer = id("course-details-all-errors");
    let errorContainerForDisplayingModules = id("course-details-display-modules-errors");

    let courseDetails = await getCourseDetails(courseId, errorContainer);
    let courseDetailsJson = await courseDetails.json();
    let data = courseDetailsJson.data;
    console.log(data);

    nameElement.textContent = `Nazwa kursu: ${data["name"]}`;
    descriptionElement.textContent = `Opis kursu: ${data["description"] == "" ? "-" : data["description"]}`;

    maxStudentsCountElement.setAttribute('class', 'badge bg-success');
    studentsAttendingElement.setAttribute("class", "badge bg-warning text-dark");
    maxStudentsCountElement.textContent = `Maksymalna liczba uczestników: ${data["maximum_students_count"]}`;
    studentsAttendingElement.textContent = `Aktualna liczba uczestników: ${data["number_of_students_attending_course"]}`;

    if (data["activity_status"] == "disabled") {
        activityStatusElement.setAttribute('class', 'badge bg-danger');
        activityStatusElement.textContent = "Kurs nieaktywny";
    }
    else {
        activityStatusElement.setAttribute('class', 'badge bg-success');
        activityStatusElement.textContent = "Kurs aktywny";
    }

    if (data["number_of_students_attending_course"] > 0) await displayAllStudents(courseId, studentsListElement, errorContainer);
    else {
        id("course-details-students-label").textContent = "Brak uczestników"
        id("course-details-checkbox-options").remove();
    }
    let moduleContainerToDisplay = id("course-details-all-modules");
    let modulesNumber = await displayAllModules(courseId, moduleContainerToDisplay, errorContainerForDisplayingModules);

}
async function displayAllModules(courseId, containerToDisplay, containerForError) {
    let modulesAssignedToThisCourse = await getModulesAssignedToThisCourse(courseId);
    if (modulesAssignedToThisCourse == null) containerForError.textContent = "Wystąpił problem z ładowaniem modułów";
    else if (Object.keys(modulesAssignedToThisCourse).length == 0) {
        containerToDisplay.textContent = "Nie dodano jeszcze żadnego modułu";
        return;
    }


    console.log(modulesAssignedToThisCourse);
}
async function getModulesAssignedToThisCourse(courseId) {
    let allModulesResponse = await getAllModules();
    if (allModulesResponse == null) return null;
    let json = await allModulesResponse.json();
    let data = json.data;
    let modulesAssignedToThisCourse = {};
    if (data.length == 0) return modulesAssignedToThisCourse;
    for (let i = 0; i < data.length; i++) {
        if (data[i]["course"] == courseId) {
            modulesAssignedToThisCourse[data[i]["order_number"]] = data[i];
        }
    }
    return modulesAssignedToThisCourse;

}
async function getAllModules() {
    let response;
    let errorOccured = false;
    let responseNotOkayFound = false;
    try {

        response = await fetch(`${appAddress}/items/Modules`, {
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
    console.log(response.statusText);
    if (errorOccured || responseNotOkayFound) return null;
    return response;
}
async function displayAllStudents(courseId, containerToDisplay, containerForError) {
    console.log(courseId);
    let numberOfBoxesChecked = 0;
    let checkboxesElements = {};
    let dataDictionary = await getStudentsFromStudentsCoursesJunctionTable(courseId, true, containerForError);
    // console.log(dataDictionary);
    let tableForStudents = document.createElement("table");
    tableForStudents.setAttribute("id", `course-details-course-number-${courseId}-students-table`);
    tableForStudents.setAttribute("class", "table table-hover");

    let tbody = document.createElement("tbody");
    tbody.setAttribute("id", `course-details-course-number-${courseId}-students-tbody`);

    let buttonToDeleteManyStudents = id("admin-courses-delete-many-students");


    for (let key in dataDictionary) {
        const row = document.createElement('tr');

        const emailBox = document.createElement('td');
        emailBox.setAttribute('id', `course-details-email-${courseId}`);
        emailBox.textContent = `${dataDictionary[key][2]}`;
        row.appendChild(emailBox);

        const deleteButtonBox = document.createElement('td');
        const deleteButton = document.createElement('button');
        deleteButton.setAttribute('type', 'button');
        deleteButton.setAttribute('id', key);
        deleteButton.setAttribute('class', 'btn-close');
        deleteButton.setAttribute('aria-label', 'close');
        deleteButtonBox.appendChild(deleteButton);
        deleteButton.addEventListener('click', async function (e) {
            e.preventDefault();
            await deleteStudentsManager(courseId, key, containerForError);
        })
        row.appendChild(deleteButtonBox);

        const checkboxBox = document.createElement('td');
        checkboxBox.setAttribute('id', `course-details-${courseId}`);

        const checkbox = document.createElement('input');
        checkbox.setAttribute('id', `course-details-checkbox-${key}`);
        checkbox.setAttribute('class', `form-check-input`);
        checkbox.setAttribute('type', 'checkbox');
        checkbox.addEventListener('click', function () { numberOfBoxesChecked = enableDisableButton(this, buttonToDeleteManyStudents, numberOfBoxesChecked) });
        checkboxesElements[`${key}`] = checkbox;
        checkboxBox.appendChild(checkbox);
        row.appendChild(checkboxBox);

        // row.appendChild(checkboxBox);
        // <button type="button" class="btn-close" aria-label="Close"></button>

        tbody.appendChild(row);
    }
    tableForStudents.appendChild(tbody);
    containerToDisplay.appendChild(tableForStudents);

    buttonToDeleteManyStudents.addEventListener('click', async function (e) {
        e.preventDefault();
        await deleteManyUsersFromParticularCourseManager(checkboxesElements, courseId, containerForError);
    });
}
async function deleteManyUsersFromParticularCourseManager(checkboxes, courseId, errorContainer) {
    let studentsIdsToDelete = [];
    for (let key in checkboxes) {
        console.log(checkboxes[key].checked);
        if (checkboxes[key].checked) studentsIdsToDelete.push(checkboxes[key].getAttribute('id').slice(24));
    }
    let itemsToDeleteIds = [];
    for (let i = 0; i < studentsIdsToDelete.length; i++) {
        let itemToDeleteId = await findItemIdInjunction_directus_users_CoursesBased(courseId, studentsIdsToDelete[i]);
        console.log(itemToDeleteId);
        itemsToDeleteIds.push(itemToDeleteId);
    }
    // studentsIdsToDelete.forEach(async function (studentId) {
    //     let itemToDeleteId = await findItemIdInjunction_directus_users_CoursesBased(courseId, studentId);
    //     console.log(itemToDeleteId);
    //     itemsToDeleteIds.push(itemToDeleteId);
    // });
    console.log(itemsToDeleteIds);
    let deleted = await deleteManyUsersFromParticularCourse(JSON.stringify(itemsToDeleteIds));
    if (deleted) {
        updateCourseInfoConcerningStudentsNumber(courseId, errorContainer, itemsToDeleteIds.length);
        // window.location.reload();
    }
}

async function deleteManyUsersFromParticularCourse(dataToDelete) {
    console.log(dataToDelete.length);
    let response;
    let errorOccured = false;
    let responseNotOkayFound = false;
    try {

        response = await fetch(`${appAddress}/items/junction_directus_users_Courses`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("access_token")}`
            },
            body: dataToDelete
        });
        if (!response.ok) responseNotOkayFound = true;

    }
    catch (err) {
        console.error(`${err}`);
        errorOccured = true;
    }
    console.log(response.statusText);
    if (errorOccured || responseNotOkayFound) return false;
    return true;
}
async function deleteStudentsManager(courseId, studentId, errorContainer) {

    let itemIdToDelete = await findItemIdInjunction_directus_users_CoursesBased(courseId, studentId);
    let deleted = await deleteStudentFromCourse(itemIdToDelete, courseId, errorContainer);
    if (!deleted) errorContainer.textContent = "Nie udało się usunąć użytkownika";
    else document.location.reload();

    // data.forEach(function (item) {
    //     console.log(item);
    //     if (item["Courses_id"] == courseId && item["directus_users_id"] == studentId) {
    //         console.log(item["id"]);
    //     }
    // })
}
async function findItemIdInjunction_directus_users_CoursesBased(courseId, studentId, errorContainer) {
    let allItemsFromStudentsCoursesJunctionTable = await getAllItemsFromStudentsCoursesJunctionTable(errorContainer);
    // console.log(allItemsFromStudentsCoursesJunctionTable);
    let data = allItemsFromStudentsCoursesJunctionTable.data;
    let itemIdToDelete = -1;
    for (let i = 0; i < data.length; i++) {
        let item = data[i];
        if (item["Courses_id"] == courseId && item["directus_users_id"] == studentId) {
            itemIdToDelete = item["id"];
            break;
        }
    }
    return itemIdToDelete;
}
async function deleteStudentFromCourse(itemInjunction_directus_users_CoursesId, courseId, errorContainer) {
    let deleted = await deleteStudentFromCourseDatabase(itemInjunction_directus_users_CoursesId);
    if (deleted) await updateCourseInfoConcerningStudentsNumber(courseId, errorContainer);
    return deleted;
}
async function updateCourseInfoConcerningStudentsNumber(courseId, errorContainer, numberOfStudentsDeleted) {
    let courseInfoResponse = await getCourseDetails(courseId, errorContainer);
    let json = await courseInfoResponse.json();
    let currentStudentsCount = json.data["number_of_students_attending_course"];
    await updateCourse(courseId, "number_of_students_attending_course", currentStudentsCount - numberOfStudentsDeleted, "studentsCount");
}

async function deleteStudentFromCourseDatabase(itemInjunction_directus_users_CoursesId) {
    let response;
    let responseNotOkayFound = false;
    let errorOccured = false;
    try {
        response = await fetch(`${appAddress}/items/junction_directus_users_Courses/${itemInjunction_directus_users_CoursesId}`, {
            method: 'DELETE',
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
    if (responseNotOkayFound || errorOccured) return false;
    return true;

}

