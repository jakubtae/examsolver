const dialog = document.querySelector("dialog");
setTimeout(() => {
    dialog.showModal();
}, 3000)

document.querySelector("#close-button").addEventListener("click", () =>{
    dialog.close();
})