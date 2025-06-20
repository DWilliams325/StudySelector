// Load and Save with localStorage
let data = loadData();

function loadData() {
  const saved = localStorage.getItem("flashcardData");
  return saved ? JSON.parse(saved) : {
    "Health": {
      "Biology": [
        { question: "What is mitosis?", solution: "Cell division where one cell divides into another", images: [] }
      ]
    }
  };
}

function saveData() {
  localStorage.setItem("flashcardData", JSON.stringify(data));
}

function saveSolution() {
  const solution = document.getElementById("solution-input").value.trim();
  data[currentSubject][currentClass][currentQuestionIndex].solution = solution;
  saveData();
  alert("✅ Solution saved!");
}

// Globals
let currentSubject = null;
let currentClass = null;
let currentQuestionIndex = 0;
let pageHistory = [];
let currentSolutionIndex = 0;
let wheelAngle = 0;
let spinning = false;

function getCurrentSolutionSteps() {
  const question = data[currentSubject][currentClass][currentQuestionIndex];
  if (!question.solutionSteps) {
    question.solutionSteps = [];
  }
  return question.solutionSteps;
}

function setWelcomeMessage() {
  const name = prompt("Enter your name:")?.trim();
  if (name) {
    document.getElementById("welcome-message").textContent = `Welcome, ${name}!`;
    localStorage.setItem("flashcardUserName", name); // Save name
  }
}


// Page Switching
function hideAllPages() {
  document.querySelectorAll("div[id$='-page']").forEach(div => {
    div.style.display = "none";
  });
}

function switchPage(id) {
  hideAllPages();
  document.getElementById(id).style.display = "block";
}

function goBack() {
  pageHistory.pop(); // Remove current
  const previous = pageHistory.pop(); // Go to previous
  if (previous) {
    switchPage(previous);
    if (previous === "home-page") loadSubjects();
    else if (previous === "class-page") loadClasses();
    else if (previous === "question-page") loadQuestions();
  } else {
    switchPage("home-page");
    loadSubjects();
  }
}

function goToHomePage() {
  switchPage("home-page");
  loadSubjects();

  // Set name from localStorage or ask for it
  const name = localStorage.getItem("flashcardUserName");
  const welcomeMessage = document.getElementById("welcome-message");
  if (name) {
    welcomeMessage.textContent = `Lets study, ${name}!`;
  } else {
    setWelcomeMessage();
  }
}


function goToClassPage(subjectName) {
  currentSubject = subjectName;
  pageHistory.push("class-page");
  switchPage("class-page");
  loadClasses();
}

function goToQuestionPage(className) {
  currentClass = className;
  pageHistory.push("question-page");
  switchPage("question-page");
  loadQuestions();
}

function goToQuestionViewPage(index) {
  currentQuestionIndex = index;
  pageHistory.push("question-view-page");
  switchPage("question-view-page");

  const question = data[currentSubject][currentClass][index].question;
  document.getElementById("question-content").textContent = question;
}


function goToSolutionPage(index) {
  currentQuestionIndex = index;
  pageHistory.push("solution-page");
  switchPage("solution-page");

  currentSolutionIndex = 0;
  renderCurrentSolution();
}
function goToWheelPage() {
  pageHistory.push("wheel-page");
  switchPage("wheel-page");
  drawWheel();
}



// Loaders
function loadSubjects() {
  const container = document.getElementById("subjects");
  const dropdown = document.getElementById("delete-subject-dropdown");
  container.innerHTML = "";
  dropdown.innerHTML = "";
  for (const subject in data) {
    const btn = document.createElement("button");
    btn.textContent = subject;
    btn.onclick = () => goToClassPage(subject);
    container.appendChild(btn);

    const opt = document.createElement("option");
    opt.value = subject;
    opt.textContent = subject;
    dropdown.appendChild(opt);
  }
}

function loadClasses() {
  const container = document.getElementById("classes");
  const dropdown = document.getElementById("delete-class-dropdown");
  container.innerHTML = "";
  dropdown.innerHTML = "";
  for (const className in data[currentSubject]) {
    const btn = document.createElement("button");
    btn.textContent = className;
    btn.onclick = () => goToQuestionPage(className);
    container.appendChild(btn);

    const opt = document.createElement("option");
    opt.value = className;
    opt.textContent = className;
    dropdown.appendChild(opt);
  }
}

function loadQuestions() {
  const container = document.getElementById("questions");
  const dropdown = document.getElementById("delete-question-dropdown");
  container.innerHTML = "";
  dropdown.innerHTML = "";
  const list = data[currentSubject][currentClass];
  list.forEach((q, i) => {
    const btn = document.createElement("button");
    btn.textContent = q.question;
    btn.onclick = () => goToQuestionViewPage(i);
    container.appendChild(btn);

    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = q.question;
    dropdown.appendChild(opt);
  });
}

// --- CRUD Functions ---
function createSubject() {
  const name = prompt("Enter subject name:");
  if (name && !data[name]) {
    data[name] = {};
    saveData();
    loadSubjects();
  }
}

function deleteSubject() {
  const name = document.getElementById("delete-subject-dropdown").value;
  if (data[name]) {
    delete data[name];
    saveData();
    loadSubjects();
  }
}

function createClass() {
  const name = prompt("Enter class name:");
  if (name && !data[currentSubject][name]) {
    data[currentSubject][name] = [];
    saveData();
    loadClasses();
  }
}

function deleteClass() {
  const name = document.getElementById("delete-class-dropdown").value;
  if (data[currentSubject][name]) {
    delete data[currentSubject][name];
    saveData();
    loadClasses();
  }
}

function createQuestion() {
  const q = prompt("Enter question:")?.trim();
  if (!q) {
    alert("Question is required.");
    return;
  }

  if (!data[currentSubject]) data[currentSubject] = {};
  if (!data[currentSubject][currentClass]) data[currentSubject][currentClass] = [];

  data[currentSubject][currentClass].push({
    question: q,
    solutionSteps: []  // MUST be here for addSolutionText/addSolutionImage to work
  });

  saveData();
  loadQuestions();
}


function deleteQuestion() {
  const index = document.getElementById("delete-question-dropdown").value;
  data[currentSubject][currentClass].splice(index, 1);
  saveData();
  loadQuestions();
}

function editUserName() {
  const name = prompt("Enter your name:");
  if (name) {
    localStorage.setItem("username", name);
    updateWelcomeMessage();
  }
}

function updateWelcomeMessage() {
  const name = localStorage.getItem("username") || "Guest";
  const message = document.getElementById("welcome-message");
  message.textContent = `Let's study, ${name}!`;
}


// Call it once on page load
updateWelcomeMessage();



//Image handling/Solution Page 
function addSolutionImage() {
  const fileInput = document.getElementById("image-upload");
  const file = fileInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const base64 = e.target.result;
    const steps = getCurrentSolutionSteps();
    steps.push({ type: "image", content: base64 });
    saveData();
    currentSolutionIndex = steps.length - 1;
    renderCurrentSolution();
  };
  reader.readAsDataURL(file);
}

function addSolutionText() {
  const text = prompt("Enter solution step:")?.trim();
  if (!text) return;
  const steps = getCurrentSolutionSteps();
  steps.push({ type: "text", content: text });
  saveData();
  currentSolutionIndex = steps.length - 1;
  renderCurrentSolution();
}

function deleteCurrentSolution() {
  const steps = getCurrentSolutionSteps();
  if (steps.length === 0) return;

  steps.splice(currentSolutionIndex, 1);
  if (currentSolutionIndex >= steps.length) currentSolutionIndex = steps.length - 1;
  saveData();
  renderCurrentSolution();
}

function pickRandomQuestion() {
  const questions = data[currentSubject][currentClass];
  if (questions.length === 0) {
    alert("No questions available in this class.");
    return;
  }

  const randomIndex = Math.floor(Math.random() * questions.length);
  goToSolutionPage(randomIndex);
}



function nextSolutionStep() {
  const steps = getCurrentSolutionSteps();
  if (currentSolutionIndex < steps.length - 1) {
    currentSolutionIndex++;
    renderCurrentSolution();
  }
}

function prevSolutionStep() {
  if (currentSolutionIndex > 0) {
    currentSolutionIndex--;
    renderCurrentSolution();
  }
}

function renderCurrentSolution() {
  const display = document.getElementById("solution-display");
  const steps = getCurrentSolutionSteps();
  display.innerHTML = "";

  if (steps.length === 0) {
    display.textContent = "No solution steps added yet.";
    return;
  }

  const step = steps[currentSolutionIndex];
 if (step.type === "text") {
  const textElem = document.createElement("div");
  textElem.textContent = step.content;
  textElem.style.maxWidth = "80%";
  textElem.style.wordWrap = "break-word";
  display.appendChild(textElem);

}else if (step.type === "image") {
    const img = document.createElement("img");
    img.src = step.content;
    img.alt = "Solution Image";
    img.style.maxWidth = "90%";
    img.style.maxHeight = "90%";
    display.appendChild(img);
  }
}

function drawWheel() {
  const canvas = document.getElementById("wheel-canvas");
  const ctx = canvas.getContext("2d");
  const questions = data[currentSubject][currentClass];
  const sliceCount = questions.length;
  const radius = canvas.width / 2;
  const sliceAngle = (2 * Math.PI) / sliceCount;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw slices
  for (let i = 0; i < sliceCount; i++) {
    const angle = i * sliceAngle + wheelAngle;
    ctx.beginPath();
    ctx.moveTo(radius, radius);
    ctx.arc(radius, radius, radius, angle, angle + sliceAngle);
    ctx.fillStyle = i % 2 === 0 ? "#ffde59" : "#f8c74d";
    ctx.fill();
    ctx.stroke();

    // Draw question text
    ctx.save();
    ctx.translate(radius, radius);
    ctx.rotate(angle + sliceAngle / 2);
    ctx.textAlign = "right";
    ctx.fillStyle = "#031e50";
    ctx.font = "14px Arial";
    ctx.fillText(questions[i].question.slice(0, 20) + "...", radius - 10, 5);
    ctx.restore();
  }

  // Draw pointer arrow (top center)
  ctx.fillStyle = "#031e50";
  ctx.beginPath();
  ctx.moveTo(radius, 30);           // Tip of arrow
  ctx.lineTo(radius - 10, 10);     // Left edge
  ctx.lineTo(radius + 10, 10);     // Right edge
  ctx.closePath();
  ctx.fill();
}


function spinWheel() {
  if (spinning) return;
  spinning = true;

  const questions = data[currentSubject][currentClass];
  const sliceCount = questions.length;
  const sliceAngle = (2 * Math.PI) / sliceCount;

  let spinTime = 0;
  let totalSpin = 3000 + Math.random() * 2000; // 3–5 seconds
  let start = performance.now();

  function animateSpin(time) {
    const elapsed = time - start;
    if (elapsed >= totalSpin) {
      const finalAngle = wheelAngle % (2 * Math.PI);
      const index = sliceCount - Math.floor(finalAngle / sliceAngle) - 1;
      spinning = false;
      goToQuestionViewPage(index);
      return;
    }

    const progress = elapsed / totalSpin;
    const easeOut = Math.pow(1 - progress, 2);
    wheelAngle += 0.3 * easeOut;
    drawWheel();
    requestAnimationFrame(animateSpin);
  }

  requestAnimationFrame(animateSpin);
}

// --- Init ---
goToHomePage();
