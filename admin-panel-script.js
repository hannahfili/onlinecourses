import {
    id, classes, nameGetter, appAddress, studentRoleId, teacherRoleId, adminRoleId,
    validateEmail, validatePassword, logOut, redirectToIndexIfUserIsNotLoggedInAdmin,
    checkIfUserIsLoggedInAndIfItIsAdmin, getAllUsersFromDatabase, enableDisableButton,
    isolateParticularGroupOfUsersFromAllUsers
} from './general-script.js';
let buttonGoToUsers = id("admin-panel-button-users");
let buttonGoToCourses = id("admin-panel-button-courses");
let buttonLogOut = id("admin-panel-log-out");

buttonGoToUsers.addEventListener('click', function (e) {
    e.preventDefault();
    document.location = '/admin-users.html'
});
buttonGoToCourses.addEventListener('click', function (e) {
    e.preventDefault();
    document.location = '/admin-courses.html'
});
buttonLogOut.addEventListener('click', async function (e) {
    e.preventDefault();
    await logOut();
});

