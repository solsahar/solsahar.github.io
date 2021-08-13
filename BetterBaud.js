//Copyright 2021 Jianqing Gao
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//


var studentId = 0
var toggleBtnInited = false // True if the "grade" button is initialized

/**
 * Show the grade on the "graded" button
 * @param gradeDOM The document object of the graded button
 * @param maxPoints The maximum points possible
 * @param pointsEarned The points earned by student
 * @param letter The letter grade
 */
function showGradeDOM(gradeDOM, maxPoints, pointsEarned, letter) {
    //see if show letter grade / numeric grade
    if (pointsEarned != null && maxPoints != null) {
        gradeDOM.innerHTML = pointsEarned + "<strong>/</strong>" + maxPoints + (letter === null ? "" : " (" + letter + ")")
    } else if (letter != null) {
        gradeDOM.innerHTML = letter
    } else {
        gradeDOM.innerHTML = "Unknown"
    }
}

/**
 * See if the page is a valid page for scraping.
 * @returns {boolean}
 */
function isValidPage()
{
    //grid view is not supported
    return window.location.href.includes("assignment-center") && document.getElementById("calendar-container")==null
}

/**
 * Check the grade of the indicated assignment from Blackbaud ON API.
 * Parameters can be get from the assignment link (href).
 * @param gradeDOM The "grade" document object
 * @param assignmentId The id of the assignment to be checked
 * @param assignmentIndexId The index id of the assignment to be checked.
 */
function lookUpGrade(gradeDOM, assignmentId, assignmentIndexId) {
    console.log("start to lookup grade!!")
    //see if the grade is displaying
    var ds = gradeDOM.getAttribute("data-showing");
    if (ds == "false") {
        gradeDOM.setAttribute("data-showing", "true")
        // see if the attribute has stored the grade

        if (gradeDOM.getAttribute("data-showed") == "true") {
            var maxPoints = gradeDOM.getAttribute("data-maxPoints")
            var pointsEarned = gradeDOM.getAttribute("data-pointsEarned")
            var letter = gradeDOM.getAttribute("data-letter")
            showGradeDOM(gradeDOM,maxPoints,pointsEarned,letter)
        } else {

            //a bit anime effect after user clicks
            //usually the anime time is sufficient for the API call, thus making it
            //a smooth transition
            var temptxt = document.createElement("span")
            //var sjid = "fadingDOM" + getRandomInt(1000)
            //temptxt.setAttribute("id", sjid)
            temptxt.innerHTML = "Graded"
            gradeDOM.innerHTML = ""
            gradeDOM.appendChild(temptxt)
            var loadingImage = document.createElement("img")
            loadingImage.setAttribute("src", "https://xeduocdn.sirv.com/icons/spinner.svg")
            loadingImage.setAttribute("alt", "loading...")
            loadingImage.setAttribute("title", "Please wait, your grade is loading...")
            loadingImage.setAttribute("style", "height: 15px;")
            $(temptxt).fadeOut("slow", () => {
                temptxt.innerHTML = ""
                temptxt.appendChild(loadingImage)
                $(temptxt).fadeIn("slow")
            })

            // send a request to get the grade
            var xhr = new XMLHttpRequest();
            const domain = window.location.hostname;//the domain of the webpage
            xhr.open("GET", "https://"+domain+"/api/datadirect/AssignmentStudentDetail?format=json&studentId=" + studentId + "&AssignmentIndexId=" + assignmentIndexId)
            xhr.onreadystatechange = (e) => {
                //handle the response
                if (xhr.readyState === 4 && xhr.status === 200) {
                    //retrieve the grade info of the student
                    var responseJSON = JSON.parse(xhr.responseText)[0]
                    //read info from JSON
                    var maxPoints = responseJSON.maxPoints
                    var pointsEarned = responseJSON.pointsEarned
                    var letter = responseJSON.Letter
                    //see if show letter grade / numeric grade
                    showGradeDOM(gradeDOM, maxPoints, pointsEarned, letter)
                    gradeDOM.setAttribute("data-showed", "true")
                    gradeDOM.setAttribute("data-maxPoints", maxPoints)
                    gradeDOM.setAttribute("data-pointsEarned", pointsEarned)
                    if (letter != null) {
                        gradeDOM.setAttribute("data-letter", letter)
                    }
                }else if(xhr.readyState === 4)
                {
                    console.log("This plugin is not supported by your school.")
                }
            }
            //send the request
            xhr.send()
        }

    } else {
        gradeDOM.innerHTML = "Graded"
        gradeDOM.setAttribute("data-showing", "false")
    }
}




function lookUpGradeClick(index, assignmentId, assignmentIndexId) {
    //get the table DOM
    var tbody = document.getElementById("assignment-center-assignment-items");

    //split the whole table into rows
    var rows = tbody.children

    var gradeDOM = rows[index].children[5].children[0].children[0].children[0]

    lookUpGrade(gradeDOM, assignmentId, assignmentIndexId);
}

/**
 * initalizes the system, get the student name and show the button
 */
function initGrade() {
    if (!isValidPage())
    {
        console.log("Grid view is not supported!")
        return null
    }
    console.log("yay!")
    // declear variables
    var rows, row, details, name, link, statusDOM, status;
    var tbody
//add my custom css classes
    var style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = '.clickLike { cursor: pointer; }';
    document.getElementsByTagName('head')[0].appendChild(style);

    //look up student Id
    studentId = document.getElementById("profile-link").getAttribute("href").split("/")[1]

    //get the table DOM
    tbody = document.getElementById("assignment-center-assignment-items");

    //split the whole table into rows
    rows = tbody.children

    // iterate through the table
    for (let i = 0; i < rows.length; i++) {
        //into one row
        row = rows[i].children;

        details = row[2].children;
        // get the name of the assignment
        //sometimes there is a small text "online submission" underneath the name, we need to get rid of that
        if (details.length >= 1) {
            name = details[0].innerHTML
            link = details[0].getAttribute("href")
        } else {
            name = details.innerHTML
            link = details.getAttribute("href")
        }

        //get the status
        statusDOM = row[5].children[0].children[0].children[0]
        status = statusDOM.innerHTML

        //continue only if the status is graded
        if (status === "Graded") {
            //add css class
            statusDOM.classList.add("clickLike");
            statusDOM.setAttribute("title", "Click here to show your grade!")
            const linksp = link.split("#")
            link = linksp[linksp.length-1]//get the id part of the link in case it shows the full URL
            const assignmentId = link.split("/")[1]
            const assignmentIndexId = link.split("/")[2]
            //use event listener to avoid conflict
            //statusDOM.addEventListener("click", lookUpGrade(statusDOM, assignmentId, assignmentIndexId))
            statusDOM.setAttribute("onclick", "lookUpGradeClick(" + i + "," + assignmentId + "," + assignmentIndexId + ")")
            statusDOM.setAttribute("data-showing", "false")
            statusDOM.setAttribute("data-index-id", assignmentIndexId)
            statusDOM.classList.add("showableGrade")//add a class to identify those showable grades
        }

    }
}

//
function toggleAllGrade(factor) {
    var doms = document.getElementsByClassName("showableGrade")
    var gradeDOM
    //go through the whole table
    for (var i = 0, max = doms.length; i < max; i++) {
        gradeDOM = doms[i];
        if (gradeDOM.getAttribute("data-showing") == factor) {
            lookUpGrade(gradeDOM, gradeDOM.getAttribute("data-id"), gradeDOM.getAttribute("data-index-id"))
        }
    }
}

function insertButton() {
    //clear unspporoted menu
    const ms = document.getElementsByClassName("unsupportedMenu")
    for (let i = 0, max = ms.length; i < max; i++) {
        ms[i].setAttribute("display","none")
    }

    //insert the show grade button into the nav bar

    console.log("ini")
    //root container
    const tgt = document.getElementsByClassName("assignment-calendar-button-bar")[0]
    //root toggle btn
    const btn = document.createElement("button")
    btn.classList.add("btn")
    btn.classList.add("btn-sm")
    btn.classList.add("btn-default")
    btn.classList.add("dropdown-toggle")
    btn.setAttribute("data-toggle", "dropdown")
    btn.setAttribute("type", "button")
    btn.innerText = "Grades"
    //toggle list / attributes
        const menu = document.createElement("ul")
        menu.classList.add("dropdown-menu")
        menu.setAttribute("role", "menu")
    if (isValidPage()) {

        // list idems
        const showOpt = document.createElement("li")
        const showOpta = document.createElement("a")
        //inside list item
        showOpta.innerText = "Show All Grades"
        showOpta.classList.add("clickLike")
        showOpta.setAttribute("onclick", "toggleAllGrade(\"false\");")
        showOpt.setAttribute("title", "Show all your grades on the list")
        showOpt.appendChild(showOpta)
        //another list idem, hide option
        const hideOpt = document.createElement("li")
        const hideOpta = document.createElement("a")
        hideOpta.innerText = "Hide All Grades"
        hideOpta.classList.add("clickLike")
        hideOpta.setAttribute("onclick", "toggleAllGrade(\"true\");")
        hideOpt.setAttribute("title", "Hide all grades on the list")
        hideOpt.appendChild(hideOpta)
        //constructing revalide manu option
        const initOpt = document.createElement("li")
        const initOpta = document.createElement("a")
        initOpta.innerText = "Revalidate"
        initOpta.classList.add("clickLike")
        initOpta.setAttribute("onclick", "initGrade()")
        initOpt.setAttribute("title", "This will re-initialize the program. Use this if you find" +
            "any abnormality")
        initOpt.appendChild(initOpta)

        const settingOpt = document.createElement("li")
        const settingOpta = document.createElement("a")
        settingOpta.href = "javascript:toggleSettingMenu()"
        settingOpta.innerText = "Settings"
        settingOpta.classList.add("clickLike")
        settingOpta.setAttribute("data-toggle", "modal")
        settingOpta.setAttribute("data-target", "#gradeSetting")
        settingOpt.appendChild(settingOpta)


        //append the items into the root
        menu.appendChild(showOpt)
        menu.appendChild(hideOpt)
        menu.appendChild(initOpt)
        menu.appendChild(settingOpt)
    }else{
        const unsupportedOpt = document.createElement("li")
        const unsupportedOpta = document.createElement("a")
        unsupportedOpta.innerHTML = "Grid view is not supported for this plugin.<br>" +
            " Click here, switch to list view to continue"
        unsupportedOpta.setAttribute("href","javascript:toListView")
        unsupportedOpta.classList.add("clickLike")
        unsupportedOpt.appendChild(unsupportedOpta)
        menu.appendChild(unsupportedOpt)
        menu.classList.add("unsupportedMenu")
    }

    //toggle to the root document
    tgt.appendChild(btn)
    tgt.appendChild(menu)

}

/**
 * Switch user view to list view.
 */
function toListView()
{
    document.getElementsByClassName("list-mode-button")[0].click()
    setTimeout(()=>{
        initGrade()
        loadSettings()

    },3000)
}

function loadSettings()
{
    //declear and construct containers
    const modalRoot = document.createElement("div")
    const modal_dialog = document.createElement("div")
    const modal_content = document.createElement("div")
    const modal_header = document.createElement("div")
    const modal_body = document.createElement("div")
    const modal_footer = document.createElement("div")
    const dismiss_button = document.createElement("button")
    const modal_title = document.createElement("h4")
    //customized elements
    const body = document.createElement("p")
    const footer_close_button = document.createElement("button")

    //set attribute of containers
    modalRoot.classList.add("modal")
    modalRoot.classList.add("fade")
    modalRoot.id = "gradeSetting"
    modalRoot.setAttribute("role","dialog")
    modal_dialog.classList.add("modal-dialog")
    modal_content.classList.add("modal-content")
    modal_header.classList.add("modal-header")

    dismiss_button.classList.add("close")
    dismiss_button.setAttribute("type","button")
    dismiss_button.setAttribute("data-dismiss","modal")
    dismiss_button.innerText = "x"
    modal_header.classList.add("modal-header")
    modal_title.classList.add("modal-title")
    modal_title.innerText = "Grade Settings" // the title of the modal
    modal_body.classList.add("modal-body")
    ///customization of the modal body here
    body.innerHTML = "<input type='checkbox' checked> Auto-Revalidate"
    ///end of customization
    modal_footer.classList.add("modal-footer")
    modal_footer.style.textAlign = "right"
    ///add customization of footer
    footer_close_button.classList.add("btn")
    footer_close_button.setAttribute("type","button")
    footer_close_button.setAttribute("data-dismiss","modal")
    footer_close_button.innerText = "Close"

    //add components to their containers
    modal_header.appendChild(modal_title)
    modal_header.appendChild(dismiss_button)

    //modal_body.appendChild()
    /// add the costmized items to the body
    modal_body.appendChild(body)
    modal_footer.appendChild(footer_close_button)
    //add components to the container
    modal_content.appendChild(modal_header)
    modal_content.appendChild(modal_body)
    modal_content.appendChild(modal_footer)
    modal_dialog.appendChild(modal_content)
    modalRoot.appendChild(modal_dialog)

    document.getElementsByTagName("body")[0].appendChild(modalRoot)
}

function toggleSettingMenu(){
    if (!toggleBtnInited)
    {
        var btn = document.createElement("button")
      btn.setAttribute("data-toggle","modal")
      btn.setAttribute("data-target","#gradeSetting")
     btn.style.visibility="hidden";
     btn.id = "toggleSetting"
     document.getElementsByTagName("body")[0].appendChild(btn)
        toggleBtnInited=true
    }

    document.getElementById("toggleSetting").click()


}
$(document).ready(() => {
    var x = setInterval(() => {
        if (document.getElementById("profile-link") != null && document.getElementById("assignment-center-assignment-items") != null && document.getElementsByClassName("assignment-calendar-button-bar")[0] != undefined) {
            console.log("init grade in root method!")
            initGrade();
            insertButton();
            loadSettings();
            setTimeout(() => {
                clearInterval(x)
            }, 1000);
        } else {
            console.log("not ready yet!")
        }
    }, 1500);

})
