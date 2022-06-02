import {
    id, classes, nameGetter, appAddress, studentRoleId, teacherRoleId, adminRoleId,
    validateEmail, validatePassword, logOut, redirectToIndexIfUserIsNotLoggedInAdmin,
    checkIfUserIsLoggedInAndIfItIsAdmin, getAllUsersFromDatabase, enableDisableButton,
    isolateParticularGroupOfUsersFromAllUsers, getAllCoursesFromDatabase, getCourseDetails,
    getStudentsFromStudentsCoursesJunctionTable, getAllItemsFromStudentsCoursesJunctionTable,
    updateCourse, getSectionsAssignedToTheModule, getAllSections, checkIfElementOccursInArrayMoreThanOnce,
    getTeachersDataToDisplay, getModulesAssignedToThisCourse, getAllModules, deleteTeacherFromCourse,
    addFileElementManager, checkIfUserIsLoggedIn, refreshToken, getUserInfo
} from './general-script.js';
import{
    displayUpperInfo, displayWeekTimetable, setMondayAndSaturdayForThisWeek, displayDate, addMeeting,
    getStartTime, getEndTime
} from './teacher-panel-script.js';


let leftArrowClicked = 0;
let rightArrowClicked = 0;

window.onload = (async function () {
    await redirectToIndexIfUserIsNotLoggedInStudent();
    let userInfo = await getUserInfo(localStorage.getItem("loggedInUserId"));
    console.log(userInfo);
    let pageName = id("student-panel-page-name");
    let nameTextNode = document.createTextNode(`${userInfo["email"]}`);
    pageName.appendChild(nameTextNode);

    let divForSettingMeetings = id("student-panel-set-meetings-div");
    let divForTimetable=id("student-panel-week-timetable");
    let divForWeekData = id("student-panel-week-name");
    let divForSelectTeacher=id("student-panel-select-teacher-div");
    let selectTeacherElement=id("student-panel-select-teacher-to-meet");
    // let divForShiftForm = id("teacher-panel-shift-form");


    let weekStartEnd = setMondayAndSaturdayForThisWeek();
    // console.log(localStorage.getItem("setMainContainerToShiftForm"));

    if (localStorage.getItem("setMainContainerToSetMeeting") == "true") {
        // divForTable.remove();
        // divForTable.style.visibility="visible";
        localStorage.setItem("setMainContainerToSetMeeting", false);
        await chooseTeacherAndSetMeeting(divForTimetable, divForWeekData, weekStartEnd, divForSelectTeacher, selectTeacherElement);
    }
    // else if (localStorage.getItem("setMainContainerToCalendar") == "true") {
    //     divForShiftForm.remove();
    //     localStorage.setItem("setMainContainerToCalendar", false);
    //     await setMainContainerToCalendar(divForTable, divForWeekData, weekStartEnd);
    // }


    let buttonToSetMeetingWithTeacher = id("student-panel-set-meeting-button");
    buttonToSetMeetingWithTeacher.addEventListener('click', async function (e) {
        e.preventDefault();
        localStorage.setItem("setMainContainerToSetMeeting", true);
        window.location.reload();
    });

    // let buttonMainMenu = id("teacher-panel-main-menu");
    // buttonMainMenu.addEventListener('click', async function (e) {
    //     e.preventDefault();
    //     window.location = "teacherPanel.html";
    // });

    // let buttonToSetShift = id("teacher-panel-set-shift-button");
    // buttonToSetShift.addEventListener('click', async function (e) {
    //     e.preventDefault();
    //     localStorage.setItem("setMainContainerToShiftForm", true);
    //     window.location.reload();
    // });



});
function setHowManyWeeksToAdd() {
    if (leftArrowClicked == rightArrowClicked) return 0;
    let rightNumber = rightArrowClicked;
    let leftNumber = -leftArrowClicked;
    return rightNumber + leftNumber;

}
async function setMeetingWithTeacherAddTeachersSelectOptions(containerForSelect, errorContainer) {
    
    
    let teachersDictionary = await isolateParticularGroupOfUsersFromAllUsers(errorContainer,
        teacherRoleId, "Wystąpił problem z pobieraniem nauczycieli z serwera", "teachers");

    console.log(teachersDictionary);
    // let sectionOfteachers = id("add-course-teacher");
    let option = document.createElement('option');
    option.setAttribute('value', 'none');
    option.textContent = "-";

    containerForSelect.appendChild(option);

    for (let key in teachersDictionary) {
        let first_name = teachersDictionary[key][0];
        let last_name = teachersDictionary[key][1];
        let email = teachersDictionary[key][2];
        let display = "";

        if (first_name != null && last_name != null) display = first_name + " " + last_name;
        else display = email;

        option = document.createElement('option');
        option.setAttribute('value', key);
        option.textContent = `${display}`;

        containerForSelect.appendChild(option);

    }


}
async function chooseTeacherAndSetMeeting(divForTable, divForWeekData, weekStartEnd,  divForSelectTeacher, selectTeacherElement){
   let errorContainer=id("student-panel-select-teacher-to-meet-error");
    divForSelectTeacher.style.visibility="visible";
   await setMeetingWithTeacherAddTeachersSelectOptions(selectTeacherElement);
   let submitButton=id("student-panel-select-teacher-to-meet-submit-button");
   submitButton.addEventListener('click', async function (e) {
    e.preventDefault();
    if(selectTeacherElement.value!="none") {showTeachersCalendar(divForTable, divForWeekData, weekStartEnd, selectTeacherElement.value);
    errorContainer.textContent='';
    }
    else errorContainer.textContent="Musisz wybrać nauczyciela, aby sprawdzić grafik"; 
});

//    await 

}
async function showTeachersCalendar(divForTable, divForWeekData, weekStartEnd, teacherId) {
    console.log("RIGHT: ",rightArrowClicked);
    console.log("LEFT: ",leftArrowClicked);

    divForTable.style.visibility = "visible";
    displayUpperInfo(divForWeekData, weekStartEnd);
    setWeekdaysDates(weekStartEnd);
    console.log(teacherId);

    let buttonsIds=id("student-panel-shift-choice-button-");

    await displayWeekTimetable(weekStartEnd, document.querySelectorAll(".student-panel-week-day-indicator"),
    "student-panel-timetable-", teacherId, true);
    
    let buttonDisplayNextWeek = id("student-panel-next-week-button");
    buttonDisplayNextWeek.addEventListener('click', async function (e) {
        console.log("RIGHT: ",rightArrowClicked);
    console.log("LEFT: ",leftArrowClicked);
        e.preventDefault();
        divForTable.style.visibility = "hidden";
        rightArrowClicked += 1;
        let howManyWeeksToAdd = setHowManyWeeksToAdd();
        let weekStartEnd = setMondayAndSaturdayForThisWeek(howManyWeeksToAdd);
        divForTable.style.visibility = "visible";
        displayUpperInfo(divForWeekData, weekStartEnd, howManyWeeksToAdd);
        setWeekdaysDates(weekStartEnd);
        await displayWeekTimetable(weekStartEnd, document.querySelectorAll(".student-panel-week-day-indicator"), "student-panel-timetable-", teacherId, true);
    
    });

    let buttonDisplayPreviousWeek = id("student-panel-previous-week-button");
    buttonDisplayPreviousWeek.addEventListener('click', async function (e) {
        console.log("RIGHT: ",rightArrowClicked);
    console.log("LEFT: ",leftArrowClicked);
        e.preventDefault();
        divForTable.style.visibility = "hidden";
        leftArrowClicked += 1;
        let howManyWeeksToAdd = setHowManyWeeksToAdd();
        let weekStartEnd = setMondayAndSaturdayForThisWeek(howManyWeeksToAdd);
        divForTable.style.visibility = "visible";
        displayUpperInfo(divForWeekData, weekStartEnd, howManyWeeksToAdd);
        setWeekdaysDates(weekStartEnd);
        await displayWeekTimetable(weekStartEnd, document.querySelectorAll(".student-panel-week-day-indicator"), "student-panel-timetable-", teacherId, true);
    
    });



}
function setWeekdaysDates(weekStartEnd) {

    let weekdays = document.querySelectorAll(".student-panel-week-day");
    // console.log(weekdays);
    let startMonday = weekStartEnd["monday_date"];
    // let weekdaysArray=[...]
    for (let i = 0; i < weekdays.length; i++) {
        let newDate = startMonday.getTime() + i * 86400000;
        let dateToDisplay = new Date(newDate);
        let dateToDisplayAsString = displayDate(dateToDisplay);


        let newDateDiv = document.createElement("div");
        newDateDiv.setAttribute("id", `student-panel-text-node-with-date-${i}`);
        newDateDiv.textContent = dateToDisplayAsString;

        let oldDateDiv = id(`student-panel-text-node-with-date-${i}`);
        if (oldDateDiv) oldDateDiv.remove();

        weekdays[i].appendChild(newDateDiv);
        // weekdays[i].textContent+=dateToDisplayAsString;
    }


}
async function redirectToIndexIfUserIsNotLoggedInStudent() {
    let userIsLoggedAndTeacher = await checkIfUserIsLoggedInStudent();
    if (!userIsLoggedAndTeacher) {
        alert("Sesja wygasła. Zaloguj się ponownie");
        window.location.href = "/index.html";
    }
}
async function checkIfUserIsLoggedInStudent() {
    if (!checkIfUserIsStudent()) {
        console.log(localStorage.getItem("loggedInRole"));
        return false;
    }
    if (checkIfUserIsLoggedIn()) {
        // let tokenGotRefreshed = await refreshTokenIfExpired();
        let tokenGotRefreshed = await refreshToken();
        console.log(tokenGotRefreshed);
        return tokenGotRefreshed;
    }
    return false;
}
function checkIfUserIsStudent() {
    if (localStorage.getItem("loggedInRole") == studentRoleId) return true;
    return false;
}
async function addMeetingManager(startHourIndex, dateNotParsed, teacherId){

    let startTime=getStartTime(startHourIndex);
    let endTime=getEndTime(startHourIndex);



    let mainContainer=id("student-panel-main-container");
    
    let timetableContainer=id("student-panel-set-meetings-div");
    timetableContainer.remove();

    let divForInput=document.createElement("div");
    divForInput.setAttribute("id", "student-panel-set-topic-div");

    let divForMeetingDetails=document.createElement("div");
    divForMeetingDetails.setAttribute("id", "student-panel-set-topic-meeting-details");
    divForMeetingDetails.textContent=`${displayDate(dateNotParsed)} | ${startTime} - ${endTime}`;
    divForInput.appendChild(divForMeetingDetails);


    let labelForTopic=document.createElement("label");
    labelForTopic.textContent="Podaj temat spotkania:";
    divForInput.appendChild(labelForTopic);


    let topicInput=document.createElement("input");
    topicInput.type="text";
    topicInput.maxLength="100";
    topicInput.required="required";
    divForInput.appendChild(topicInput);



    let submitButton=document.createElement("button");
    submitButton.setAttribute("id", "student-panel-set-topic-submit-button");
    submitButton.textContent="Zatwierdź temat";
    divForInput.appendChild(submitButton);

    let errorContainer=document.createElement("div");
    errorContainer.setAttribute("id", "student-panel-set-topic-error");
    errorContainer.setAttribute("class", "error");
    divForInput.appendChild(errorContainer);

let added=false;
    
    mainContainer.appendChild(divForInput);
    submitButton.addEventListener('click', async function(e){
        e.preventDefault();
        if(divForInput!="") {
            added=await addMeeting(startHourIndex, dateNotParsed, topicInput.value, teacherId);
            if (added) {
                alert(`Pomyślnie dodano spotkanie! Szczegóły: data: 
                ${displayDate(dateNotParsed)}, godzina: ${getStartTime(startHourIndex)}, temat: ${topicInput.value}`);

                localStorage.setItem("setMainContainerToSetMeeting", true);
                localStorage.setItem("setMainContainerToShiftForm", true);
                window.location.reload();
            }
            else alert('BŁĄD SERWERA. Nie udało się umówić spotkania');
        }
        else errorContainer.textContent="Temat spotkania jest wymagany!";
    })

    

    
}
export {
    showTeachersCalendar, addMeetingManager
}