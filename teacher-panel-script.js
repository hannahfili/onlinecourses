import {
    id, classes, nameGetter, appAddress, studentRoleId, teacherRoleId, adminRoleId,
    validateEmail, validatePassword, logOut, redirectToIndexIfUserIsNotLoggedInAdmin,
    checkIfUserIsLoggedInAndIfItIsAdmin, getAllUsersFromDatabase, enableDisableButton,
    isolateParticularGroupOfUsersFromAllUsers, getAllCoursesFromDatabase, getCourseDetails,
    getStudentsFromStudentsCoursesJunctionTable, getAllItemsFromStudentsCoursesJunctionTable,
    updateCourse, getSectionsAssignedToTheModule, getAllSections, checkIfElementOccursInArrayMoreThanOnce,
    getTeachersDataToDisplay, getModulesAssignedToThisCourse, getAllModules, deleteTeacherFromCourse,
    addFileElementManager, checkIfUserIsLoggedIn, refreshToken
} from './general-script.js';

// import DateTime from 'luxon/src/datetime.js';

let leftArrowClicked = 0;
let rightArrowClicked = 0;

window.onload = (async function () {
    await redirectToIndexIfUserIsNotLoggedInTeacher();
    let userInfo = await getUserInfo(localStorage.getItem("loggedInUserId"));
    console.log(userInfo);
    let pageName = id("teacher-panel-page-name");
    let nameTextNode = document.createTextNode(`${userInfo["email"]}`);
    pageName.appendChild(nameTextNode);

    let divForTable = id("teacher-panel-week-timetable");
    let divForWeekData = id("teacher-panel-week-name");
    let divForShiftForm = id("teacher-panel-shift-form");


    let weekStartEnd = setMondayAndSaturdayForThisWeek();
    console.log(localStorage.getItem("setMainContainerToShiftForm"));

    if (localStorage.getItem("setMainContainerToShiftForm") == "true") {
        // divForTable.remove();
        // divForTable.style.visibility="visible";
        localStorage.setItem("setMainContainerToShiftForm", false);
        await setMainContainerToCalendar(divForTable, divForWeekData, weekStartEnd);
        await setMainContainerToShiftForm(divForShiftForm, weekStartEnd);
    }
    else if (localStorage.getItem("setMainContainerToCalendar") == "true") {
        divForShiftForm.remove();
        localStorage.setItem("setMainContainerToCalendar", false);
        await setMainContainerToCalendar(divForTable, divForWeekData, weekStartEnd);
    }


    let buttonToShowCalendar = id("teacher-panel-show-calendar-button");
    buttonToShowCalendar.addEventListener('click', async function (e) {
        e.preventDefault();
        localStorage.setItem("setMainContainerToCalendar", true);
        window.location.reload();
    });

    let buttonMainMenu = id("teacher-panel-main-menu");
    buttonMainMenu.addEventListener('click', async function (e) {
        e.preventDefault();
        window.location = "teacherPanel.html";
    });

    let buttonToSetShift = id("teacher-panel-set-shift-button");
    buttonToSetShift.addEventListener('click', async function (e) {
        e.preventDefault();
        localStorage.setItem("setMainContainerToShiftForm", true);
        window.location.reload();
    });



});
async function setMainContainerToShiftForm(divForShiftForm, weekStartEnd) {
    divForShiftForm.style.visibility = "visible";
    let buttonMonthShiftForm = id("teacher-panel-month-shift-button");
    let buttonOneTimeShiftForm = id("teacher-panel-one-time-shift-button");
    let buttonToDeleteOneDayShift = id("teacher-panel-delete-shift-from-particular-date-button");
    let buttonToDeleteOneMonthShift = id("teacher-panel-delete-shift-from-particular-month-button");

    let divMonthShiftForm = id("teacher-panel-form-for-month-shift");
    let divOneTimeShiftForm = id("teacher-panel-form-for-one-time-shift");
    let divDeleteOneDayShiftForm = id("teacher-panel-form-for-delete-shift");
    let divDeleteMonthShiftForm=id("teacher-panel-form-for-delete-shift-month");


    buttonMonthShiftForm.addEventListener('click', async function (e) {
        e.preventDefault();
        divOneTimeShiftForm.remove();
        buttonMonthShiftForm.remove();
        buttonOneTimeShiftForm.remove();
        divMonthShiftForm.style.visibility = "visible";
        await setMonthShifts();
    });
    buttonOneTimeShiftForm.addEventListener('click', async function (e) {
        e.preventDefault();
        divMonthShiftForm.remove();
        buttonMonthShiftForm.remove();
        buttonOneTimeShiftForm.remove();
        divOneTimeShiftForm.style.visibility = "visible";
        await setOneTimeShift();
    });
    buttonToDeleteOneDayShift.addEventListener('click', async function (e) {
        e.preventDefault();
        divMonthShiftForm.remove();
        divOneTimeShiftForm.remove()
        buttonMonthShiftForm.remove();
        buttonOneTimeShiftForm.remove();
        buttonToDeleteOneDayShift.remove();

        let dateInput = id("teacher-panel-form-for-delete-shift-date-choice");

        let today = new Date();
        let tomorrowForDateMaker = today.getTime() + 86400000;
        let tomorrow = new Date(tomorrowForDateMaker);
        let date = displayDate(tomorrow, true);
        dateInput.min = date;
        dateInput.value = date;
        divDeleteOneDayShiftForm.style.visibility = "visible";
        await deleteShiftManager();
    });
    buttonToDeleteOneMonthShift.addEventListener('click', async function (e) {
        e.preventDefault();
        divMonthShiftForm.remove();
        divOneTimeShiftForm.remove()
        buttonMonthShiftForm.remove();
        buttonOneTimeShiftForm.remove();
        buttonToDeleteOneDayShift.remove();
        buttonToDeleteOneMonthShift.remove();

        divDeleteMonthShiftForm.style.visibility = "visible";
        await deleteManyShiftsManager();
    });
}

async function deleteManyShiftsManager(){
    let selectForMonth=id("teacher-panel-form-for-delete-shift-month-select");
    setMonthsToChoose(selectForMonth, 'teacher-panel-form-for-delete-shift-month-select-option-');

    let submitButton=id("teacher-panel-form-for-delete-shift-month-submit-button");
    submitButton.addEventListener('click', async function (e) {
        e.preventDefault();
        let deleted=await deleteManyShiftsFromDatabase(selectForMonth.value);
        if(deleted){
            alert('Usunięto dyżury z wybranego miesiąca');
            localStorage.setItem("setMainContainerToShiftForm", true);
            window.location.reload();
        }
        else alert('BŁĄD SERWERA. Nie udało się usunąć dyżurów z wybranego miesiąca');
    });
}
async function deleteManyShiftsFromDatabase(monthSelected, teacher=localStorage.getItem("loggedInUserId")){
let allShifts= await getAllTeachersShifts(teacher);
let shiftsForChosenMonth=allShifts.filter(shift=>new Date(shift.date).getMonth()==monthSelected);
console.log(shiftsForChosenMonth);
let idsToDelete=[];
shiftsForChosenMonth.forEach(function(shift){
    idsToDelete.push(shift.id);
});

let bodyToDelete = JSON.stringify(idsToDelete);

let response;
let responseNotOkayFound = false;
let errorOccured = false;
try {
    response = await fetch(`${appAddress}/items/Shifts`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem("access_token")}`
        },
        body: bodyToDelete
    });
    if (!response.ok) responseNotOkayFound = true;
}
catch (err) {
    errorOccured = true;
    console.error(`${err}`);
}
if (responseNotOkayFound || errorOccured) return false;
return true;

}
async function deleteShiftManager() {
    let submitButton = id("teacher-panel-form-for-delete-shift-submit-button");
    submitButton.addEventListener('click', async function (e) {
        e.preventDefault();
        let dateToDelete = id("teacher-panel-form-for-delete-shift-date-choice").value;
        let deleted = await deleteShiftsOfChosenDateFromDatabase(dateToDelete);
        if (deleted) {
            alert('Pomyślnie usunięto dyżury z wybranego dnia');
            localStorage.setItem("setMainContainerToShiftForm", true);
            window.location.reload();
        }
        else alert('BŁĄD SERWERA! Nie udało się usunąć dyżurów z wybranego dnia');

    });
}
function setMonthsToChoose(selectForMonth, optionId) {
    let todayDate = new Date();
    let todayMonth = todayDate.getMonth();
    let nextMonth = todayMonth;
    console.log(nextMonth);
    let monthsNames = ['styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec', 'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień'];

    //WAŻNE - WYBÓR MIESIĘCY BĘDZIE OD 0 DO 11!!!!
    for (let i = nextMonth; i < 12; i++) {
        // console.log(endTimes[i]);
        let option = document.createElement('option');
        option.setAttribute('id', `${optionId}${i}`);
        option.value = i;
        option.textContent = monthsNames[i]
        selectForMonth.appendChild(option);
    }
}

async function setMonthShifts() {
    let selectsWithStartTimes = 0;
    let weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    let selectForMonth = id("teacher-panel-form-for-month-shift-month-choice");


    setMonthsToChoose(selectForMonth, 'teacher-panel-form-for-month-shift-month-choice-');

    for (let i = 0; i < weekdays.length; i++) {
        let weekday = weekdays[i];
        let weekDaySelectStartHour = id(`teacher-panel-form-for-month-shift-${weekday}-setup-start-hour`);
        let weekDaySelectEndHour = id(`teacher-panel-form-for-month-shift-${weekday}-setup-end-hour`);


        let option = document.createElement('option');
        option.setAttribute('id', `teacher-panel-form-for-month-shift-${weekday}-setup-end-hour-option-none`);
        option.value = 'none';
        option.textContent = '-';
        weekDaySelectEndHour.appendChild(option);

        weekDaySelectStartHour.addEventListener('change', function () {
            let endTimes = ['09:30', '11:15', '13:00', '14:45', '16:30', '18:15', '20:00'];
            let startIndex = 0;
            switch (weekDaySelectStartHour.value) {
                case 'none':
                    startIndex = -1;
                    break;
                case '08:00':
                    startIndex = 0;
                    break;
                case '09:45':
                    startIndex = 1;
                    break;
                case '11:30':
                    startIndex = 2;
                    break;
                case '13:15':
                    startIndex = 3;
                    break;
                case '15:00':
                    startIndex = 4;
                    break;
                case '16:45':
                    startIndex = 5;
                    break;
                case '18:30':
                    startIndex = 6;
                    break;
            }
            weekDaySelectEndHour.innerHTML = '';
            if (startIndex == -1) {
                let option = document.createElement('option');
                option.setAttribute('id', `teacher-panel-form-for-month-shift-${weekday}-setup-end-hour-option-none`);
                option.textContent = "-";
                weekDaySelectEndHour.appendChild(option);
            }
            else {
                for (let i = startIndex; i < endTimes.length; i++) {
                    let option = document.createElement('option');
                    option.setAttribute('id', `teacher-panel-form-for-month-shift-${weekday}-setup-end-hour-option-${i}`);
                    option.value = endTimes[i];
                    option.textContent = endTimes[i];
                    weekDaySelectEndHour.appendChild(option);
                }
            }



        });

    }
    let submitButton = id("teacher-panel-form-for-month-shift-submit-button");
    submitButton.addEventListener('click', async function (e) {
        e.preventDefault();
        await addManyShiftsManager();
    });
    let returnButton = id("teacher-panel-form-for-month-shift-return-button");
    returnButton.addEventListener('click', async function (e) {
        e.preventDefault();
        localStorage.setItem("setMainContainerToShiftForm", true);
        window.location.reload();
    });
}

async function addManyShiftsManager() {

    let errorContainer = id("teacher-panel-form-for-month-shift-error-container");

    let weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    let shiftStartsEnds = [];
    for (let i = 0; i < weekdays.length; i++) {
        let weekday = weekdays[i];
        let weekDaySelectStartHour = id(`teacher-panel-form-for-month-shift-${weekday}-setup-start-hour`);
        let weekDaySelectEndHour = id(`teacher-panel-form-for-month-shift-${weekday}-setup-end-hour`);

        let data = {
            "weekday": weekday,
            "weekday_number": changeWeekdayNameToNumber(weekday),
            "start": weekDaySelectStartHour.value,
            "end": weekDaySelectEndHour.value
        }
        if (weekDaySelectStartHour.value != "none") shiftStartsEnds.push(data);
    }
    let shiftsAdded = await addManyShiftsToDatabaseManager(shiftStartsEnds);
    // if(noneValueFound) errorContainer.textContent="Godzina rozpoczęcia dyżuru musi być ustawiona dla każdego z dni"
}
async function addManyShiftsToDatabaseManager(shiftStartsEnds) {
    let firstSevenDaysOfChosenMonth = checkWeekdaysForFirstSevenDaysOfChosenMonth();
    let errorOccured=false;
    for (let i = 0; i < firstSevenDaysOfChosenMonth.length; i++) {
        let dayOfMonth = firstSevenDaysOfChosenMonth[i];
        let shiftStartEndForParticularWeekday = shiftStartsEnds.filter(shift => shift.weekday_number == dayOfMonth.weekday_number);
        if (shiftStartEndForParticularWeekday.length > 0) {
            let addedCorrectly=await setShiftForChosenWeekdayForNextMonth(dayOfMonth, shiftStartEndForParticularWeekday[0]);
            if(!addedCorrectly) errorOccured=true;
        }
        // console.log(shiftStartEndForParticularWeekday);
    }

    if (!errorOccured) {
        alert('Poprawnie ustawiono dyżury na wybrany miesiąc');
        localStorage.setItem("setMainContainerToShiftForm", true);
        window.location.reload();
    }
    else alert('BŁĄD SERWERA - nie udało się dodać wszystkich dyżurów');
}
async function setShiftForChosenWeekdayForNextMonth(dayOfMonth, shiftData, month = id("teacher-panel-form-for-month-shift-month-choice").value,
    teacher = localStorage.getItem("loggedInUserId")) {
    // await addOneShiftToDatabase(date, startTime, endTime);
    console.log(shiftData);
    let firstDateForShift = dayOfMonth.date;
    let allItemsAdded = [];
    let allItemsRemoved = [];
    let allShiftsToAdd = [];
    // let addedCorrectly=await addOneShiftToDatabase(firstDateForShift, shiftData.start, shiftData.end);
    // allItemsAdded.push(addedCorrectly);
    for (let i = 0; i < 5; i++) {
        let timeToCreateNewDate = firstDateForShift.getTime() + 86400000 * i * 7;
        let newDate = new Date(timeToCreateNewDate);
        if (newDate.getMonth() == month) {


            let deleted = await deleteShiftsOfChosenDateFromDatabase(displayDate(newDate, true));
            allItemsRemoved.push(deleted);

            let bodyToPost = {
                "date": displayDate(newDate, true),
                "shift_start": shiftData.start + ':00',
                "shift_end": shiftData.end + ':00',
                "teacher": teacher
            };
            allShiftsToAdd.push(bodyToPost);
            // let added=await addOneShiftToDatabase(displayDate(newDate,true), shiftData.start, shiftData.end);
            // allItemsAdded.push(added);

            // console.log(newDate);

        }

    }

    let addedCorrectly = await addManyShiftsToDatabase(allShiftsToAdd);
    return addedCorrectly;
    
    // console.log(allItemsAdded);
    // console.log(allItemsRemoved);
}
async function addManyShiftsToDatabase(allShiftsToAdd) {
    let response;
    let responseNotOkayFound = false;
    let errorOccured = false;
    let dataToPostJson = JSON.stringify(allShiftsToAdd);
    try {
        response = await fetch(`${appAddress}/items/Shifts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("access_token")}`
            },
            body: dataToPostJson
        });
        if (!response.ok) responseNotOkayFound = true;
    }
    catch (err) {
        errorOccured = true;
        console.error(`${err}`);
    }
    if (responseNotOkayFound || errorOccured) return false;
    return true;
}
function checkWeekdaysForFirstSevenDaysOfChosenMonth(month = id("teacher-panel-form-for-month-shift-month-choice").value) {
    let chosenMonthFirstSevenDays = [];
    console.log(month);
    for (let i = 1; i <= 7; i++) {
        let todayDate = new Date();
        let date = new Date(todayDate.getFullYear(), month, i);
        console.log(date);
        let data = {
            "date": date,
            "weekday_number": date.getDay(),
        }
        chosenMonthFirstSevenDays.push(data);
    }
    console.log(chosenMonthFirstSevenDays);
    return chosenMonthFirstSevenDays;
}
function changeWeekdayNameToNumber(weekdayName) {
    let number = -1;
    switch (weekdayName) {
        case 'monday':
            number = 1;
            break;
        case 'tuesday':
            number = 2;
            break;
        case 'wednesday':
            number = 3;
            break;
        case 'thursday':
            number = 4;
            break;
        case 'friday':
            number = 5;
            break;
        case 'saturday':
            number = 6;
            break;
    }
    return number;

}
async function setOneTimeShift() {

    // value="2018-07-22" min="2018-01-01" max="2018-12-31">

    let inputForDate = id("teacher-panel-form-for-one-time-shift-date-choice");
    let today = new Date();
    let tomorrowForDateMaker = today.getTime() + 86400000;
    let tomorrow = new Date(tomorrowForDateMaker);
    let date = displayDate(tomorrow, true);

    inputForDate.value = date;
    inputForDate.min = date;

    let selectStartTime = id("teacher-panel-form-for-one-time-shift-select-start-time");
    let selectEndTime = id("teacher-panel-form-for-one-time-shift-select-end-time")
    selectStartTime.addEventListener('change', function () {
        // console.log('ZMIANA');
        let endTimes = ['09:30', '11:15', '13:00', '14:45', '16:30', '18:15', '20:00'];
        let startIndex = 0;
        switch (selectStartTime.value) {
            case '08:00':
                startIndex = 0;
                break;
            case '09:45':
                startIndex = 1;
                break;
            case '11:30':
                startIndex = 2;
                break;
            case '13:15':
                startIndex = 3;
                break;
            case '15:00':
                startIndex = 4;
                break;
            case '16:45':
                startIndex = 5;
                break;
            case '18:30':
                startIndex = 6;
                break;
        }
        selectEndTime.innerHTML = '';
        for (let i = startIndex; i < endTimes.length; i++) {
            // console.log(endTimes[i]);
            let option = document.createElement('option');
            option.setAttribute('id', `teacher-panel-form-for-one-time-shift-select-end-time-option-${i}`);
            option.value = endTimes[i];
            option.textContent = endTimes[i];
            selectEndTime.appendChild(option);
        }

    });

    let checkboxForDeletionOtherShifts = id("teacher-panel-form-for-one-time-shift-checkbox-for-delete");
    let errorContainer = id("teacher-panel-form-for-one-time-shift-error-container");

    let submitButton = id("teacher-panel-form-for-one-time-shift-submit-button");
    submitButton.addEventListener('click', async function (e) {
        e.preventDefault();
        if (selectStartTime.value == "none") errorContainer.textContent = "Proszę wybrać godzinę rozpoczęcia dyżuru!";
        else {
            await setShift(inputForDate.value, selectStartTime.value, selectEndTime.value, checkboxForDeletionOtherShifts);
        }
    });
    let returnButton = id("teacher-panel-form-for-one-time-shift-return-button");
    returnButton.addEventListener('click', async function (e) {
        e.preventDefault();
        localStorage.setItem("setMainContainerToShiftForm", true);
        window.location.reload();
    });


}
async function setShift(date, startTime, endTime, checkboxForDeletionOtherShifts) {
    let errorContainer = id("teacher-panel-form-for-one-time-shift-error-container");
    let deleteOtherShiftsFromChosenDate = false;
    if (checkboxForDeletionOtherShifts.checked) deleteOtherShiftsFromChosenDate = true;

    if (deleteOtherShiftsFromChosenDate) {
        let shiftsDeleted = await deleteShiftsOfChosenDateFromDatabase(date);
        if (shiftsDeleted) {
            let shiftAddedCorrectly = await addOneShiftToDatabase(date, startTime, endTime);
            if (!shiftAddedCorrectly) errorContainer.textContent = "BŁĄD SERWERA. Nie udało się dodać dyżuru";
            else {
                errorContainer.textContent = '';
                alert('Pomyślnie dodano dyżur');
                localStorage.setItem("setMainContainerToShiftForm", true);
                window.location.reload();
            }
        }
    }
    else {
        let shiftsCoverOneAnother = await checkIfShiftsDoCoverOneAnother(date, startTime, endTime);
        if (shiftsCoverOneAnother) errorContainer.textContent = "Dyżur nie może być utworzony, ponieważ pokrywa się czasowo z innym, już istniejacym";
        else {
            let shiftAddedCorrectly = await addOneShiftToDatabase(date, startTime, endTime);
            if (!shiftAddedCorrectly) errorContainer.textContent = "BŁĄD SERWERA. Nie udało się dodać dyżuru";
            else {
                errorContainer.textContent = '';
                alert('Pomyślnie dodano dyżur');
                localStorage.setItem("setMainContainerToShiftForm", true);
                window.location.reload();
            }
        }
    }

}
async function checkIfShiftsDoCoverOneAnother(date, startTime, endTime, teacher = localStorage.getItem("loggedInUserId")) {
    let shiftsForChosenDate = await getTeachersShiftsForParticularDate(date);
    let shiftsForChosenDateParsed = [];
    shiftsForChosenDate.forEach(function (element) {
        let startString = element.date + ' ' + element.shift_start;
        let endString = element.date + ' ' + element.shift_end;
        let data = {
            "start": new Date(Date.parse(startString)),
            "end": new Date(Date.parse(endString))
        };
        shiftsForChosenDateParsed.push(data);
    });

    let chosenShiftStart = new Date(Date.parse(date + ' ' + startTime));
    let chosenShiftEnd = new Date(Date.parse(date + ' ' + endTime));

    // console.log(shiftsForChosenDateParsed);

    let coverageOccured = false;

    for (let i = 0; i < shiftsForChosenDateParsed.length; i++) {
        let element = shiftsForChosenDateParsed[i];
        // console.log(element);
        if (element["start"].getTime() == chosenShiftStart.getTime() && element["end"].getTime() == chosenShiftEnd.getTime()) {
            // console.log("1 IF")
            coverageOccured = true;
            break;
        }
        if (element["start"].getTime() == chosenShiftStart.getTime()) {
            // console.log("2 IF")
            coverageOccured = true;
            break;
        }
        if (element["end"].getTime() == chosenShiftEnd.getTime()) {
            // console.log("3 IF")
            coverageOccured = true;
            break;
        }
        if (element["start"].getTime() < chosenShiftStart.getTime() && element["end"].getTime() > chosenShiftStart.getTime()) {
            // console.log("4 IF")
            coverageOccured = true;
            break;
        }
        if (chosenShiftStart.getTime() < element["start"].getTime() && chosenShiftEnd.getTime() > element["start"].getTime()) {
            // console.log("5 IF")
            coverageOccured = true;
            break;
        }
    }

    return coverageOccured;

}
async function addOneShiftToDatabase(date, startTime, endTime, teacher = localStorage.getItem("loggedInUserId")) {
    let response;
    let responseNotOkayFound = false;
    let errorOccured = false;
    let bodyToPost = {
        "date": date,
        "shift_start": startTime + ':00',
        "shift_end": endTime + ':00',
        "teacher": teacher
    };
    // console.log(bodyToPost);
    // console.log(endTime);
    let bodyToPostJson = JSON.stringify(bodyToPost);
    try {
        response = await fetch(`${appAddress}/items/Shifts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("access_token")}`
            },
            body: bodyToPostJson
        });
        if (!response.ok) responseNotOkayFound = true;
    }
    catch (err) {
        errorOccured = true;
        console.error(`${err}`);
    }
    if (responseNotOkayFound || errorOccured) return false;
    return true;
}
async function getTeachersShiftsForParticularDate(chosenDate, teacher = localStorage.getItem("loggedInUserId")) {
    let allTeachersShifts = await getAllTeachersShifts(teacher);
    let shiftsForChosenDate = allTeachersShifts
        .filter(
            n => n.date == chosenDate
        );
    return shiftsForChosenDate;
}
async function deleteShiftsOfChosenDateFromDatabase(chosenDate, teacher = localStorage.getItem("loggedInUserId")) {

    console.log(chosenDate);
    let shiftsForChosenDate = await getTeachersShiftsForParticularDate(chosenDate, teacher);
    let shiftsIdsToRemove = [];
    shiftsForChosenDate.forEach(function (element) {
        shiftsIdsToRemove.push(element.id);
    });
    console.log('###############');
    console.log(shiftsIdsToRemove);
    console.log('###############');
    let bodyToDelete = JSON.stringify(shiftsIdsToRemove);


    let response;
    let responseNotOkayFound = false;
    let errorOccured = false;
    try {
        response = await fetch(`${appAddress}/items/Shifts`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("access_token")}`
            },
            body: bodyToDelete
        });
        if (!response.ok) responseNotOkayFound = true;
    }
    catch (err) {
        errorOccured = true;
        console.error(`${err}`);
    }
    if (responseNotOkayFound || errorOccured) return false;
    return true;
}
async function setMainContainerToCalendar(divForTable, divForWeekData, weekStartEnd) {

    divForTable.style.visibility = "visible";
    displayUpperInfo(divForWeekData, weekStartEnd);
    setWeekdaysDates(weekStartEnd);

    await displayWeekTimetable(weekStartEnd);

    let buttonDisplayNextWeek = id("teacher-panel-next-week-button");
    buttonDisplayNextWeek.addEventListener('click', async function (e) {
        e.preventDefault();
        divForTable.style.visibility = "hidden";
        rightArrowClicked += 1;
        let howManyWeeksToAdd = setHowManyWeeksToAdd();
        let weekStartEnd = setMondayAndSaturdayForThisWeek(howManyWeeksToAdd);
        divForTable.style.visibility = "visible";
        displayUpperInfo(divForWeekData, weekStartEnd, howManyWeeksToAdd);
        setWeekdaysDates(weekStartEnd);
        await displayWeekTimetable(weekStartEnd);
    });

    let buttonDisplayPreviousWeek = id("teacher-panel-previous-week-button");
    buttonDisplayPreviousWeek.addEventListener('click', async function (e) {
        e.preventDefault();
        divForTable.style.visibility = "hidden";
        leftArrowClicked += 1;
        let howManyWeeksToAdd = setHowManyWeeksToAdd();
        let weekStartEnd = setMondayAndSaturdayForThisWeek(howManyWeeksToAdd);
        divForTable.style.visibility = "visible";
        displayUpperInfo(divForWeekData, weekStartEnd, howManyWeeksToAdd);
        setWeekdaysDates(weekStartEnd);
        await displayWeekTimetable(weekStartEnd);
    });



}
function setHowManyWeeksToAdd() {
    if (leftArrowClicked == rightArrowClicked) return 0;
    let rightNumber = rightArrowClicked;
    let leftNumber = -leftArrowClicked;
    return rightNumber + leftNumber;

}
function displayUpperInfo(divForWeekData, weekStartEnd, howManyWeeksToAdd = 0) {

    let weekNo = getWeekNumber(new Date())[1];
    weekNo += howManyWeeksToAdd;
    weekNo = weekNo % 52;
    if (weekNo == 0) weekNo = 52;

    let startDate = weekStartEnd["monday_date"];
    let endNewDate = startDate.getTime() + 6 * 86400000;
    let endDate = new Date(endNewDate);

    let startDateAsString = displayDate(startDate);
    let endDateAsString = displayDate(endDate);

    let dateGeneralInfoTextNode = document.createTextNode(`Tydzień numer: ${weekNo}`);
    let dateGeneralInfoTextNode2 = document.createTextNode(`${startDateAsString} - ${endDateAsString}`);
    let br = document.createElement("br");
    divForWeekData.setAttribute('style', 'white-space: pre;');

    divForWeekData.textContent = `Tydzień numer: ${weekNo}\r\n${startDateAsString} - ${endDateAsString}`;

    // divForWeekData.appendChild(dateGeneralInfoTextNode);
    // divForWeekData.appendChild(br);
    // divForWeekData.appendChild(dateGeneralInfoTextNode2);
}
function setWeekdaysDates(weekStartEnd) {

    let weekdays = document.querySelectorAll(".teacher-panel-week-day");
    // console.log(weekdays);
    let startMonday = weekStartEnd["monday_date"];
    // let weekdaysArray=[...]
    for (let i = 0; i < weekdays.length; i++) {
        let newDate = startMonday.getTime() + i * 86400000;
        let dateToDisplay = new Date(newDate);
        let dateToDisplayAsString = displayDate(dateToDisplay);


        let newDateDiv = document.createElement("div");
        newDateDiv.setAttribute("id", `teacher-panel-text-node-with-date-${i}`);
        newDateDiv.textContent = dateToDisplayAsString;

        let oldDateDiv = id(`teacher-panel-text-node-with-date-${i}`);
        if (oldDateDiv) oldDateDiv.remove();

        weekdays[i].appendChild(newDateDiv);
        // weekdays[i].textContent+=dateToDisplayAsString;
    }


}
async function displayWeekTimetable(weekStartEnd, teacherId = localStorage.getItem("loggedInUserId")) {
    let allTdsInTable = document.querySelectorAll(".teacher-panel-week-day-indicator");
    allTdsInTable.forEach(td => {
        td.style.backgroundColor = "";
        td.textContent = "";
    });


    let thisWeekShifts = await getTeacherShiftsForThisWeek(weekStartEnd);
    // console.log(thisWeekShifts);

    for (let i = 0; i < thisWeekShifts.length; i++) {
        let shiftData = thisWeekShifts[i];
        displayShiftDataInTable(shiftData);
    }

}
function displayShiftDataInTable(shiftDataDict) {



    let shiftDate = new Date(shiftDataDict["date"]);
    let shiftDayOfWeek = shiftDate.getDay();
    let startHour = shiftDataDict["shift_start"];
    let endHour = shiftDataDict["shift_end"];
    // console.log(endHour);

    // console.log(shiftDate);
    // console.log(shiftDayOfWeek);

    let tdIdWeekDayName = setWeekDayName(shiftDayOfWeek);
    // console.log(tdIdWeekDayName);

    let tdStartCell = setStartCell(startHour);
    // console.log(tdStartCell);

    let tdEndCell = setEndCell(endHour);
    // console.log(tdEndCell);

    for (let i = tdStartCell; i <= tdEndCell; i++) {
        let tdElementToChangeBackgroundColor = id(`teacher-panel-timetable-${tdIdWeekDayName}-${i}`);
        if (tdElementToChangeBackgroundColor) {
            tdElementToChangeBackgroundColor.style.backgroundColor = "green";
            tdElementToChangeBackgroundColor.textContent = "DYŻUR";
        }
    }





}
function setStartCell(startHour) {
    let tdItemNumber = 0;
    switch (startHour) {
        case "08:00:00":
            tdItemNumber = 1;
            break;
        case "09:45:00":
            tdItemNumber = 2;
            break;
        case "11:30:00":
            tdItemNumber = 3;
            break;
        case "13:15:00":
            tdItemNumber = 4;
            break;
        case "15:00:00":
            tdItemNumber = 5;
            break;
        case "16:45:00":
            tdItemNumber = 6;
            break;
        case "18:30:00":
            tdItemNumber = 7;
            break;
    }
    return tdItemNumber;

}
function setEndCell(endHour) {
    let tdItemNumber = 0;
    switch (endHour) {
        case "09:30:00":
            tdItemNumber = 1;
            break;
        case "11:15:00":
            tdItemNumber = 2;
            break;
        case "13:00:00":
            tdItemNumber = 3;
            break;
        case "14:45:00":
            tdItemNumber = 4;
            break;
        case "16:30:00":
            tdItemNumber = 5;
            break;
        case "18:15:00":
            tdItemNumber = 6;
            break;
        case "20:00:00":
            tdItemNumber = 7;
            break;
    }
    return tdItemNumber;

}
function setWeekDayName(shiftDayOfWeek) {
    let tdIdWeekDayName = "";
    switch (shiftDayOfWeek) {
        case 1:
            tdIdWeekDayName = "monday";
            break;
        case 2:
            tdIdWeekDayName = "tuesday";
            break;
        case 3:
            tdIdWeekDayName = "wednesday";
            break;
        case 4:
            tdIdWeekDayName = "thursday";
            break;
        case 5:
            tdIdWeekDayName = "friday";
            break;
        case 6:
            tdIdWeekDayName = "saturday";
            break;
        case 0:
            tdIdWeekDayName = "sunday";
            break;
    }
    return tdIdWeekDayName;
}

async function getTeacherShiftsForThisWeek(weekStartEnd) {
    let allTeachersShifts = await getAllTeachersShifts();
    let shiftsForThisWeek = allTeachersShifts
        .filter(
            n => new Date(n.date) >= weekStartEnd["monday_date"]
                && new Date(n.date) <= weekStartEnd["saturday_date"]
        );
    return shiftsForThisWeek;
    // console.log(allTeachersShifts);
    // console.log(shiftsForThisWeek);
}
async function getAllTeachersShifts(teacherId = localStorage.getItem("loggedInUserId")) {
    let response;
    let responseNotOkayFound = false;
    let errorOccured = false;
    try {
        response = await fetch(`${appAddress}/items/Shifts`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("access_token")}`
            }
        });
        if (!response.ok) responseNotOkayFound = true;
    }
    catch (err) {
        errorOccured = true;
        console.error(`${err}`);
    }
    if (responseNotOkayFound || errorOccured) return false;
    let responseJson = await response.json();
    let responseData = responseJson.data;
    // console.log(responseData);
    let thisTeacherShifts = responseData.filter(n => n.teacher == teacherId);
    return thisTeacherShifts;
}
function displayDate(date, formatWithDash = false) {
    const yyyy = date.getFullYear();
    let mm = date.getMonth() + 1; // Months start at 0!
    let dd = date.getDate();

    if (dd < 10) dd = '0' + dd;
    if (mm < 10) mm = '0' + mm;

    let dateToDisplay = dd + '.' + mm + '.' + yyyy;
    if (formatWithDash) dateToDisplay = yyyy + '-' + mm + '-' + dd;

    return dateToDisplay;
}
function setMondayAndSaturdayForThisWeek(numberOfWeeksToAddOrRemove = 0) {
    let yearWithWeekNo = getWeekNumber(new Date());
    let weekNo = yearWithWeekNo[1];
    weekNo += numberOfWeeksToAddOrRemove;

    let currentdate = new Date();
    let oneJun = new Date(currentdate.getFullYear(), 0, 1, 0, 0);

    let numberOfDaysToAdd = (weekNo - 1) * 7;
    let newDate = oneJun.getTime() + numberOfDaysToAdd * 86400000;
    let possibleMonday = new Date(newDate);
    let dayOfWeek = possibleMonday.getDay();

    while (dayOfWeek != 1) {
        numberOfDaysToAdd += 1;
        newDate = oneJun.getTime() + numberOfDaysToAdd * 86400000;
        possibleMonday = new Date(newDate);
        dayOfWeek = possibleMonday.getDay();
    }

    let mondayForThisWeek = possibleMonday;
    let newSaturday = mondayForThisWeek.getTime() + 5 * 86400000;
    let saturdayForThisWeek = new Date(newSaturday);
    saturdayForThisWeek = new Date(saturdayForThisWeek.getFullYear(), saturdayForThisWeek.getMonth(), saturdayForThisWeek.getDate(), 23, 59);

    let data = {
        "monday_date": mondayForThisWeek,
        "saturday_date": saturdayForThisWeek
    }
    return data;

    // console.log(mondayForThisWeek);
    // console.log(saturdayForThisWeek);
}
function getWeekNumber(d) {
    // Copy date so don't modify original
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    // Set to nearest Thursday: current date + 4 - current day number
    // Make Sunday's day number 7
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    // Get first day of year
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    // Calculate full weeks to nearest Thursday
    var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    // Return array of year and week number
    return [d.getUTCFullYear(), weekNo];
    // return weekNo;
}
async function redirectToIndexIfUserIsNotLoggedInTeacher() {
    let userIsLoggedAndTeacher = await checkIfUserIsLoggedInTeacher();
    if (!userIsLoggedAndTeacher) {
        alert("Sesja wygasła. Zaloguj się ponownie");
        window.location.href = "/index.html";
    }
}
async function checkIfUserIsLoggedInTeacher() {
    if (!checkIfUserIsTeacher()) {
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
function checkIfUserIsTeacher() {
    if (localStorage.getItem("loggedInRole") == teacherRoleId) return true;
    return false;
}
async function getUserInfo(userId) {
    let response;
    let errorOccured = false;
    let responseNotOkayFound = false;
    try {

        response = await fetch(`${appAddress}/users/${userId}`, {
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
    if (errorOccured || responseNotOkayFound) return null;
    let responseJson = await response.json();
    let responseData = responseJson.data;
    return responseData;
}