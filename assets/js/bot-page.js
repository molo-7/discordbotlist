const overview = document.getElementById("overview");
const info = document.getElementById("info");
const overviewBtn = document.getElementById("overview-btn");
const infoBtn = document.getElementById("info-btn");
const removeBtn = document.getElementById("remove-btn");
const approveBtn = document.getElementById("approve");
const rejectBtn = document.getElementById("reject");
const botId = document.getElementById("_id")?.dataset.id;
const botName = document.getElementById("_id")?.dataset.username;

if (document.body.offsetWidth <= 870) {
  info.hidden = true;
}

window.onresize = function (e) {
  if (document.body.offsetWidth <= 870) {
    if (overview.hidden || info.hidden) return;
    info.hidden = true;
  } else {
    info.hidden = false;
    overview.hidden = false;
    overviewBtn.classList.add("active");
    infoBtn.classList.remove("active");
  }
};

infoBtn.onclick = function (e) {
  infoBtn.classList.add("active");
  overviewBtn.classList.remove("active");
  info.hidden = false;
  overview.hidden = true;
};

overviewBtn.onclick = function (e) {
  overviewBtn.classList.add("active");
  infoBtn.classList.remove("active");
  overview.hidden = false;
  info.hidden = true;
};

if (removeBtn) {
  removeBtn.onclick = function (e) {
    e.preventDefault();
    let confirmScreen = document.createElement("div");
    confirmScreen.className = "_confirm";
    confirmScreen.innerHTML = `<form action="/bot/actions/remove/${botId}" method="POST"><h1>😕 Are you sure that you want to remove ${botName}</h1><div class="buttons"><input type="submit" value="Yes!" class="bad"><div class="go-back" onclick="document.body.querySelector('._confirm').remove()">No, Go Back</div></div></form>`
    document.body.appendChild(confirmScreen)
  }
}

if (approveBtn) {
  approveBtn.onclick = function (e) {
    e.preventDefault();
    let confirmScreen = document.createElement("div");
    confirmScreen.className = "_confirm";
    confirmScreen.innerHTML = `<form action="/bot/actions/approve/${botId}" method="POST"><h1>Are you sure about approving ${botName} 👀🤖</h1><div class="buttons"><input type="submit" value="Absolutely !" class="good"><div class="go-back" onclick="document.body.querySelector('._confirm').remove()">No, I'll think again</div></div></form>`
    document.body.appendChild(confirmScreen)
  }
}

if (rejectBtn) {
  rejectBtn.onclick = function (e) {
    e.preventDefault();
    let confirmScreen = document.createElement("div");
    confirmScreen.className = "_confirm";
    confirmScreen.innerHTML = `<form action="/bot/actions/reject/${botId}" method="POST"><h1>⚠️ Are you sure about rejecting ${botName} ?</h1><input type="text" placeholder="Give a convincing reason about rejecting this bot" class="input" name="reason" required maxlength="2000"><div class="buttons"><input type="submit" value="Reject ${botName}" class="bad"><div class="go-back" onclick="document.body.querySelector('._confirm').remove()">No, I'll think again</div></div></form>`
    document.body.appendChild(confirmScreen)
  }
}