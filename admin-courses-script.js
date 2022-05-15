import {
    id, classes, nameGetter, appAddress, studentRoleId, teacherRoleId, adminRoleId,
    validateEmail, validatePassword, logOut, redirectToIndexIfUserIsNotLoggedInAdmin,
    checkIfUserIsLoggedInAndIfItIsAdmin, getAllUsersFromDatabase, enableDisableButton,
    isolateParticularGroupOfUsersFromAllUsers, getAllCoursesFromDatabase
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
                teachersBox.setAttribute('id', `course-details-teacher-${teachers[i]}`);
                for (let i in teachers) {
                    let text = document.createTextNode(`${teachers[i]}`);
                    teachersBox.appendChild(text);
                    let comma = document.createTextNode(", ");
                    console.log(i);
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
                buttonDeleteCourse.addEventListener('click', function () { /*FUNKCJA DO USUWANIA KURSU*/ });

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
                    window.location = "addStudentsToCourse.html";
                    localStorage.setItem("courseIdToAddStudents", course["id"]);
                });

                addStudentBox.appendChild(buttonAddStudent);
                row.appendChild(addStudentBox);

                //utworzenie okienka na przycisk do otworzenia szczegółów kursu
                const showDetailsBox = document.createElement('td');
                showDetailsBox.setAttribute('id', `course-details-show-details-${course["id"]}`);
                const buttonShowDetails = document.createElement('button');
                buttonShowDetails.setAttribute('id', `button-admin-courses-show-details-${course["id"]}`);
                buttonShowDetails.setAttribute('class', `btn btn-secondary`);
                buttonShowDetails.textContent = "Pokaż szczegóły";
                buttonShowDetails.addEventListener('click', function () { /*FUNKCJA DO USUWANIA KURSU*/ });

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
                buttonActivateDesactivate.addEventListener('click', function () { /*FUNKCJA DO (dez)    aktywacji KURSU*/ });

                activateDesactivateBox.appendChild(buttonActivateDesactivate);
                row.appendChild(activateDesactivateBox);


                mainContainer.appendChild(row);


            })(i);

        }
    }
}

async function getTeachersDataToDisplay(course_directus_users_relation_ids) {
    let teachersData = {};
    let teachersDataToDisplay = [];
    console.log(course_directus_users_relation_ids);
    for (let number in course_directus_users_relation_ids) {
        console.log(number);
        teachersData[course_directus_users_relation_ids[number]] = await getTeacherIdFromCourseDirectusUsersRelation(course_directus_users_relation_ids[number]);
    }
    for (let key in teachersData) {
        if (teachersData[key] != -1) {
            let data = await getTeacherDataById(teachersData[key]);
            if (data != -1) teachersDataToDisplay.push(data);
        }
    }
    console.log(teachersData);
    return teachersDataToDisplay;
}
async function getTeacherIdFromCourseDirectusUsersRelation(id) {
    let response;
    try {
        response = await fetch(`${appAddress}/items/Courses_directus_users/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("access_token")}`
            }
        });
        if (response.ok) {
            let json = await response.json();
            return json.data["directus_users_id"];
        }
    }
    catch (err) {
        alert(err);
        console.error(`${err}`);
        return -1;
    }

}
async function getTeacherDataById(id) {
    let response;
    try {
        response = await fetch(`${appAddress}/users/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("access_token")}`
            }
        });
        if (response.ok) {
            let json = await response.json();
            let first_name = json.data["first_name"];
            let last_name = json.data["last_name"];
            let email = json.data["email"];
            if (first_name != null && last_name != null) return first_name + " " + last_name;
            else return email;
        }
    }
    catch (err) {
        alert(err);
        console.error(`${err}`);
        return -1;
    }
}