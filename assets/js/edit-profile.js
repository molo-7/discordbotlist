const bio = document.getElementById("bio");
const banner = document.getElementById("banner");
const submit = document.getElementById("submit");
const editedValue = (input, propName) => input.value === profileData[propName];
const activeSubmitButton = (input, propName) => (
  (submit.disabled = editedValue(input, propName)), removerErrors(input.parentElement)
);
const _ = document.getElementById("profile_data");
const profileData = _.dataset;
const imagesHost = "https://i.imgur.com/";

if (bio) bio.addEventListener("keyup", (e) => activeSubmitButton(bio, "bio"));
if (banner) banner.addEventListener("keyup", (e) => activeSubmitButton(banner, "banner"));

let ok = false,
  error = false;
if (submit) {
  submit.onclick = (e) => {
    if (ok) return;
    e.preventDefault();
    if (bio.value === profileData.bio && banner.value === profileData.banner) {
      error = true;
      submit.disabled = true;
    }
    if (bio.value.length > 140) {
      showErr(bio.parentElement, "Bio length can't be more than 140");
      error = true;
    }
    if (banner.value.length > 0) {
      if (!banner.value.startsWith(imagesHost)) {
        showErr(
          banner.parentElement,
          'Banner\'s image url can only be provided from <a href="https://imgur.com/upload">imgur</a><br>Example <code>https://i.imgur.com/N6uQ1zQ.jpg</code>'
        );
        error = true;
      } else if (
        !["png", "jpg"].includes(
          banner.value.slice(banner.value.length - 3)
        )
      ) {
        showErr(
          banner.parentElement,
          "Supported formats: <code>png and jpg</code>"
        );
        error = true;
      }
    }
    if (!error) (ok = true), submit.click();
  };
}

function showErr(parentElement, htmlMessage) {
  removerErrors(parentElement);
  const errorElement = document.createElement("span");
  errorElement.className = "error";
  errorElement.innerHTML = htmlMessage;
  parentElement.classList.add("error");
  parentElement.appendChild(errorElement);
}

function removerErrors(parentElement) {
  error = false;
  parentElement.classList.remove("error");
  const oldError = Array.from(parentElement.children).find((e) =>
    e.classList.contains("error")
  );
  if (oldError) oldError.remove();
}
