(function () {
  // __
  const _ = document.getElementById("botmodel");
  const BOT = _.dataset;
  _.remove();
  // dropdown
  const dropdownContainer = document.getElementById("dropdown");
  const selectedTags = dropdownContainer.querySelector(".header .selected");
  let selectedTagsArr = [];
  const tags = Array.from(dropdownContainer.querySelectorAll("ul.list li"));
  const submitBtn = document.getElementById("submit");

  if (BOT.edit && BOT.tags) {
    BOT.tags.split(",").forEach(tagId => {
      let ele = document.querySelector(`[data-id=${tagId}]`);
      tags.find(t => t.dataset.id === tagId)?.classList.add("disabled");
      ele.querySelector(".remove").onclick = () => activeTagBtn(ele);
      selectedTagsArr.push(ele);
    })
  }

  dropdownContainer.onclick = (e) => {
    if (
      !e.target.classList.contains("tag") &&
      !e.target.classList.contains("remove") &&
      !e.target.classList.contains("li")
    ) {
      dropdownContainer.classList.toggle("active");
      dropdownContainer.classList.remove("required");
      if (selectedTagsArr.length > 0) submitBtn.disabled = false;
    }
  };

  tags.forEach((tag) => {
    tag.onclick = () => {
      if (selectedTags.querySelector(".no-tags"))
        selectedTags.querySelector(".no-tags").remove();
      if (
        selectedTagsArr.some(
          (t) => t.dataset.id.toLowerCase() === tag.dataset.id.toLowerCase()
        )
      )
        return;
      tag.classList.add("disabled");
      const tagEle = document.createElement("div");
      tagEle.innerHTML = `<span><i class="fas fa-hashtag"></i>${tag.dataset.id}</span><i class="fas fa-times remove"></i>`;
      tagEle.className = "tag";
      tagEle.dataset.id = tag.dataset.id;
      selectedTagsArr.push(tagEle);
      tagEle.querySelector(".remove").onclick = () => activeTagBtn(tagEle);
      selectedTags.appendChild(tagEle);
    };
  });

  const activeTagBtn = (tag) => {
    if (!selectedTagsArr.includes(tag)) return;
    selectedTagsArr.splice(selectedTagsArr.indexOf(tag), 1);
    if (selectedTagsArr.length <= 6) {
      dropdownContainer.classList.remove("required");
      dropdownContainer.nextElementSibling?.classList.contains("error")
        ? dropdownContainer.nextElementSibling.remove()
        : "";
    }
    if (selectedTagsArr.length === 0) {
      selectedTags.innerHTML = "";
      selectedTags.innerHTML = '<div class="no-tags">Select tags</div>';
      submitBtn.disabled = true;
    }
    Array.from(dropdownContainer.querySelectorAll("ul.list li"))
      .find((t) => t.dataset.id.toLowerCase() === tag.dataset.id.toLowerCase())
      .classList.remove("disabled");
    tag.remove();
  };

  // form
  const briefDesc = document.getElementById("brief-desc");
  const longDesc = document.getElementById("long-desc");
  const prefix = document.getElementById("prefix");
  const inviteUrl = document.getElementById("invite-url");
  const supportServer = document.getElementById("support-server");
  const githubRepo = document.getElementById("github-repo");
  const devInputs = Array.from(
    document.querySelectorAll("#devs .input input[type='text']")
  );
  const customizablePrefix = document.getElementById("customizable");
  let ok = false,
    error = false;

  const isInputEmpty = (input) => input.value.length === 0;
  const activeSubmitButton = (input) => (
    (submitBtn.disabled =
      isInputEmpty(briefDesc) ||
      isInputEmpty(longDesc) ||
      isInputEmpty(prefix) ||
      isInputEmpty(inviteUrl) ||
      selectedTagsArr.length === 0),
    input.classList.remove("required"),
    input.parentElement.querySelector(".error")?.remove(),
    (error = false)
  );

  briefDesc.addEventListener("keyup", (e) => activeSubmitButton(briefDesc));
  longDesc.addEventListener("keyup", (e) => activeSubmitButton(longDesc));
  prefix.addEventListener("keyup", (e) => activeSubmitButton(prefix));
  inviteUrl.addEventListener("keyup", (e) => activeSubmitButton(inviteUrl));

  supportServer.addEventListener(
    "keyup",
    (e) => (
      supportServer.classList.remove("required"),
      supportServer.parentElement.querySelector(".error")?.remove(),
      (error = false)
    )
  );
  githubRepo.addEventListener(
    "keyup",
    (e) => (
      supportServer.classList.remove("required"),
      supportServer.parentElement.querySelector(".error")?.remove(),
      (error = false)
    )
  );
  devInputs.forEach((e) =>
    e.addEventListener(
      "keyup",
      () => (
        (error = false),
        e.classList.remove("required"),
        e.nextElementSibling?.classList.contains("error")
          ? e.nextElementSibling.remove()
          : ""
      )
    )
  );

  activeSubmitButton(briefDesc);

  submitBtn.onclick = (e) => {
    if (!ok) {
      e.preventDefault();
      /* check required fields */
      if (isInputEmpty(briefDesc)) {
        error = true;
        briefDesc.classList.add("required");
      }
      if (isInputEmpty(longDesc)) {
        error = true;
        longDesc.classList.add("required");
      }
      if (isInputEmpty(prefix)) {
        error = true;
        prefix.classList.add("required");
      }
      if (isInputEmpty(inviteUrl)) {
        error = true;
        inviteUrl.classList.add("required");
      }
      if (selectedTagsArr.length === 0) {
        error = true;
        dropdownContainer.classList.add("required");
      }
      /* check fields requirements */
      if (!isInputEmpty(briefDesc) && briefDesc.value.length > 140) {
        error = true;
        displayFieldError(
          briefDesc,
          "Breif Description Maximum Length 140 Character !"
        );
      }
      if (!isInputEmpty(longDesc)) {
        if (longDesc.value.length < 200) {
          error = true;
          displayFieldError(longDesc, "Minimum Length 200 Character !");
        } else if (longDesc.value.length > 2000) {
          error = true;
          displayFieldError(
            longDesc,
            "Long Description Can't Be More Than 2000 Character !"
          );
        }
      }
      if (!isInputEmpty(prefix) && prefix.value.length > 5) {
        error = true;
        displayFieldError(prefix, "Prefix Can't Be More Than 5 Characters !");
      }
      if (selectedTagsArr.length > 6) {
        error = true;
        displayFieldError(
          dropdownContainer,
          "You Can't Pick More Than 6 Tags !"
        );
      }
      if (
        !isInputEmpty(inviteUrl) &&
        (
          !inviteUrl.value.startsWith("https://discord.com/oauth2/authorize") &&
          !inviteUrl.value.startsWith("https://discord.com/api/oauth2/authorize")
        )
      ) {
        error = true;
        displayFieldError(
          inviteUrl,
          "Invalid Bot Invition Link, Redirects are not available"
        );
      }
      if (
        !isInputEmpty(supportServer) &&
        (!supportServer.value.startsWith("https://discord.gg/") &&
          !supportServer.value.startsWith("https://discord.com/invite/"))
      ) {
        error = true;
        displayFieldError(
          supportServer,
          "Support Server Invitation Link Must Starts With https://discord.gg/ or https://discord.com/invite/"
        );
      }
      if (!isInputEmpty(githubRepo) && !githubRepo.value.startsWith("https://github.com")) {
        error = true;
        displayFieldError(
          githubRepo,
          "Invalid github repository url"
        );
      }
      devInputs.forEach((input) => {
        if (
          !isInputEmpty(input) &&
          (input.value.trim().length !== 18 || isNaN(input.value))
        ) {
          error = true;
          displayFieldError(input, "Invalid id format");
        }
      });
      if (!error) {
        ok = true;
        const dataform = document.querySelector("form.form");
        if (!dataform) return;
        document.body.innerHTML = `<style id="loaderStyle">html{height:100%}._loader{z-index:100;width:100%;height:100%;position:fixed;background-color:#131b23;display:flex;justify-content:center;align-items:center}._loader .gif{width:150px;max-width:100%;height:auto}</style><div class="_loader" id="_loader"><video width="320" height="240" autoplay loop playsinline muted><source src="/images/logo_loading.webm" type="video/webm" />Your browser does not support the video tag.</video></div>`;
        const tags = selectedTagsArr.map((ele) => ele.dataset.id.toLowerCase());
        const form = document.createElement("form");
        form.action = BOT.edit ? "/bot/actions/edit/" + BOT.id : "/addbot";
        form.method = "post";
        if (BOT.edit) {
          form.innerHTML = `<input type="hidden" name="about" value="${briefDesc.value}"><input type="hidden" name="markdown" value="${longDesc.value}"><input type="hidden" name="prefix" value="${prefix.value}"><input type="hidden" name="customizablePrefix" value="${customizablePrefix.checked}"><input type="hidden" name="tags" value="${tags}"><input type="hidden" name="inviteUrl" value="${inviteUrl.value}"><input type="hidden" name="supportServer" value="${supportServer.value}"><input type="hidden" name="githubRepo" value="${githubRepo.value}"><input type="hidden" name="dev1" value="${devInputs[0]?.value ?? 0}"><input type="hidden" name="dev2" value="${devInputs[1]?.value ?? 0}"><input type="submit" id= "__submit" value="Loading...">`;
        } else {
          form.innerHTML = `<input type="hidden" name="submit" value="true"><input type="hidden" name="submitter" value="${BOT.submitter}"><input type="hidden" name="submitterAvatar" value="${BOT.submitteravatar ? BOT.submitteravatar : ""}"><input type="hidden" name="id" value="${BOT.id}"><input type="hidden" name="tag" value="${BOT.tag}"><input type="hidden" name="avatar" value="${BOT.avatar}"><input type="hidden" name="about" value="${briefDesc.value}"><input type="hidden" name="markdown" value="${longDesc.value}"><input type="hidden" name="prefix" value="${prefix.value}"><input type="hidden" name="customizablePrefix" value="${customizablePrefix.checked}"><input type="hidden" name="tags" value="${tags}"><input type="hidden" name="inviteUrl" value="${inviteUrl.value}"><input type="hidden" name="supportServer" value="${supportServer.value}"><input type="hidden" name="githubRepo" value="${githubRepo.value}"><input type="hidden" name="dev1" value="${devInputs[0]?.value ?? 0}"><input type="hidden" name="dev2" value="${devInputs[1]?.value ?? 0}"><input type="submit" id= "__submit" value="Loading...">`;
        }
        document.body.appendChild(form);
        document.getElementById("__submit").click();
        document.getElementById("__submit").addEventListener("click", (e) => e.preventDefault());
      } else {
        const hint = document.createElement("div");
        hint.classList.add("popup");
        hint.classList.add("danger");
        hint.textContent = "You have some validation errors ⚠️";
        document.body.appendChild(hint);
        window.setTimeout(() => hint.remove(), 3000);
      }
    }
  };

  function displayFieldError(input, error, insert) {
    const errEle = document.createElement("div");
    errEle.textContent = error;
    errEle.className = "error";
    input.classList.add("required");
    input.parentElement.querySelector(".error")?.remove()
    insert
      ? input.parentElement.insertBefore(errEle, input.nextElementSibling)
      : input.parentElement.appendChild(errEle);
  }
})();
