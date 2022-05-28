import {
    id, classes, nameGetter, appAddress, studentRoleId, teacherRoleId, adminRoleId,
    validateEmail, validatePassword, logOut, redirectToIndexIfUserIsNotLoggedInAdmin,
    checkIfUserIsLoggedInAndIfItIsAdmin, getAllUsersFromDatabase, enableDisableButton,
    isolateParticularGroupOfUsersFromAllUsers, getAllCoursesFromDatabase, getCourseDetails,
    getStudentsFromStudentsCoursesJunctionTable, getAllItemsFromStudentsCoursesJunctionTable,
    updateCourse, getSectionsAssignedToTheModule, getAllSections, checkIfElementOccursInArrayMoreThanOnce, getTeachersDataToDisplay
} from './general-script.js';

window.onload = (async function () {
    await displayAllCourses();
})


async function displayAllCourses() {
    for (let key in localStorage) {
        if (key.substring(0, 11) == 'new-select-') {
            localStorage.removeItem(key);
        }
    }
    await redirectToIndexIfUserIsNotLoggedInAdmin();
    let courses = await getAllCoursesFromDatabase();
    let mainContainer = id("admin-courses-all-courses-table-display");

    if (!courses.ok) {
        id("admin-courses-all-courses").remove();
        id("admin-courses-delete-many-courses").remove();
        id("admin-courses-error-message").textContent = "Nie udało się pobrać danych"
    }
    else {
        const coursesJson = await courses.json();
        console.log(JSON.stringify(coursesJson));
        if (coursesJson.data.length == 0) {
            id("admin-courses-all-courses").remove();
            id("admin-courses-delete-many-courses").remove();
            id("admin-courses-error-message").textContent = "Nie dodano jeszcze żadnego kursu!"
        }
        else {

        }
        for (var i = 0; i < coursesJson.data.length; i++) {
            (async function (index) {
                var course = coursesJson.data[index];
                let name = course["name"];

                let teachers = await getTeachersDataToDisplay(course["teacher"]);
                let description = course["description"];
                //utworzenie wiersza
                const row = document.createElement('tr');
                //utworzenie okienka na nazwę kursu
                const courseBox = document.createElement('td');
                courseBox.setAttribute('id', `course-details-name-${course["id"]}`);
                courseBox.textContent = `${name}`;
                row.appendChild(courseBox);

                // console.log(teachers);
                //utworzenie okienka na nauczycieli
                const teachersBox = document.createElement('td');
                teachersBox.setAttribute('id', `course-details-teacher-${course["id"]}`);
                for (let i in teachers) {
                    let text = document.createTextNode(`${teachers[i]}`);
                    teachersBox.appendChild(text);
                    let comma = document.createTextNode(", ");
                    // console.log(i);
                    if (i != teachers.length - 1) teachersBox.appendChild(comma);
                }
                row.appendChild(teachersBox);

                //utworzenie okienka na przycisk do edycji kursu
                const editBox = document.createElement('td');
                editBox.setAttribute('id', `course-details-edit-${course["id"]}`);
                const buttonEditCourse = document.createElement('button');
                buttonEditCourse.setAttribute('id', `button-admin-courses-edit-course-${course["id"]}`);
                buttonEditCourse.setAttribute('class', `btn btn-secondary`);
                buttonEditCourse.textContent = "Edytuj kurs";
                buttonEditCourse.addEventListener('click', function (e) {
                    e.preventDefault();
                    localStorage.setItem("courseIdEdit", course["id"]);
                    window.location = "editCourse.html";
                });

                editBox.appendChild(buttonEditCourse);
                row.appendChild(editBox);
                //utworzenie okienka na przycisk do usuwania kursu
                const deleteBox = document.createElement('td');
                deleteBox.setAttribute('id', `course-details-delete-${course["id"]}`);
                const buttonDeleteCourse = document.createElement('button');
                buttonDeleteCourse.setAttribute('id', `button-admin-courses-delete-course-${course["id"]}`);
                buttonDeleteCourse.setAttribute('class', `btn btn-secondary`);
                buttonDeleteCourse.textContent = "Usuń kurs";
                buttonDeleteCourse.addEventListener('click', async function () { await deleteCourseManager(course); });

                deleteBox.appendChild(buttonDeleteCourse);
                row.appendChild(deleteBox);

                //utworzenie okienka na przycisk do dodawania ucznia do kursu
                const addStudentBox = document.createElement('td');
                addStudentBox.setAttribute('id', `course-details-add-student-${course["id"]}`);
                const buttonAddStudent = document.createElement('button');
                buttonAddStudent.setAttribute('id', `button-admin-courses-add-student-${course["id"]}`);
                buttonAddStudent.setAttribute('class', `btn btn-secondary`);
                buttonAddStudent.textContent = "Dodaj uczniów";
                buttonAddStudent.addEventListener('click', function (e) {
                    e.preventDefault();
                    localStorage.setItem("courseIdToAddStudents", course["id"]);
                    window.location = "addStudentsToCourse.html";
                });

                addStudentBox.appendChild(buttonAddStudent);
                row.appendChild(addStudentBox);

                //utworzenie okienka na przycisk do otworzenia szczegółów kursu
                const showDetailsBox = document.createElement('td');
                showDetailsBox.setAttribute('id', `course-details-show-details-${course["id"]}`);
                const buttonShowDetails = document.createElement('button');
                buttonShowDetails.setAttribute('id', `button-admin-courses-show-details-${course["id"]}`);
                buttonShowDetails.setAttribute('class', `btn btn-secondary`);
                buttonShowDetails.textContent = "Szczegóły kursu";
                buttonShowDetails.addEventListener('click', function () {
                    localStorage.setItem("courseIdToShowDetails", course["id"]);
                    window.location = "course-details.html";
                });

                showDetailsBox.appendChild(buttonShowDetails);
                row.appendChild(showDetailsBox);

                //utworzenie okienka na przycisk do aktywacji/dezaktywacji kursu
                const activateDesactivateBox = document.createElement('td');
                activateDesactivateBox.setAttribute('id', `course-details-activate-desactivate-${course["id"]}`);
                const buttonActivateDesactivate = document.createElement('button');
                buttonActivateDesactivate.setAttribute('id', `button-admin-courses-activate-desactivate-${course["id"]}`);
                buttonActivateDesactivate.setAttribute('class', `btn btn-secondary`);
                let enableOrDisable = "";
                course["activity_status"] == "disabled" ? enableOrDisable = "Aktywuj" : enableOrDisable = "Dezaktywuj";
                // if(course["activity_status"]=="disabled"){
                //     enableOrDisable="Aktywuj kurs"
                // }
                // else{

                // }
                buttonActivateDesactivate.textContent = enableOrDisable;
                buttonActivateDesactivate.addEventListener('click', async function (e) {
                    e.preventDefault();
                    if(buttonActivateDesactivate.textContent=="Aktywuj"){
                        await des_activateCourse(course["id"], "active");
                    }
                    else{
                        await des_activateCourse(course["id"], "disabled");
                    }
                    
                    window.location.reload();
                 });

                activateDesactivateBox.appendChild(buttonActivateDesactivate);
                row.appendChild(activateDesactivateBox);

                //utworzenie okienka na przycisk szczegółowego podglądu kursu
                const previewBox = document.createElement('td');
                previewBox.setAttribute('id', `course-details-preview-${course["id"]}`);
                const buttonPreview = document.createElement('button');
                buttonPreview.setAttribute('id', `button-admin-courses-preview-${course["id"]}`);
                buttonPreview.setAttribute('class', `btn btn-secondary`);
                buttonPreview.textContent = "Edycja modułów i sekcji";
                buttonPreview.addEventListener('click', function (e) {
                    e.preventDefault();
                    localStorage.setItem("courseIdToShowDetails", course["id"]);
                    window.location="courses-all-modules-sections.html";
                 });

                previewBox.appendChild(buttonPreview);
                row.appendChild(previewBox);


                mainContainer.appendChild(row);


            })(i);

        }
    }
}
async function des_activateCourse(courseId, des_activate){
    let response;
    let responseNotOkayFound = false;
    let errorOccured = false;
    let info="";
    let bodyToPost={
        "activity_status": des_activate
    }
    let bodyToPostJson=JSON.stringify(bodyToPost);

    if(des_activate=="active") info="Aktywowano kurs";
    else info="Kurs nieaktywny";
    try {
        response = await fetch(`${appAddress}/items/Courses/${courseId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("access_token")}`
            },
            body:bodyToPostJson
        });
        if (!response.ok) responseNotOkayFound = true;
    }
    catch (err) {
        console.error(`${err}`);
        errorOccured = true;
    }
    if (responseNotOkayFound || errorOccured) alert('Wystąpił problem ze zmianą statusu aktywności kursu');
    else alert(info);
}
async function deleteCourseManager(course) {
    console.log(course["id"]);
    console.log(course["name"]);
    let courseId = course["id"];
    let courseName = course["name"];
    let confirmed = window.confirm(`Czy na pewno chcesz usunąć kurs: ${courseName}?`);
    let courseDeleted = false;
    let message;
    if (confirmed) {
        courseDeleted = await deleteCourseFromDatabase(courseId);
        if (courseDeleted) message = `Usunięto kurs: ${courseName}`;
        else message = "Nastąpił problem przy usuwaniu kursu";
    }
    else {
        message = `Kurs ${courseName} nie został usunięty`;
    }
    alert(message);
    if (confirmed) document.location.reload();
}
async function deleteCourseFromDatabase(courseId) {
    let response;
    let responseNotOkayFound = false;
    let errorOccured = false;
    try {
        response = await fetch(`${appAddress}/items/Courses/${courseId}`, {
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



