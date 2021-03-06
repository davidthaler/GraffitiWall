window.addEventListener('load', main)

function getHTML(){
    let frame = document.querySelector('iframe')
    let workspace = document.querySelector('textarea')
    if(frame.src.endsWith('.html')){
        workspace.value = frame.contentDocument.querySelector('html').innerHTML
    }else{
        workspace.value = frame.contentDocument.querySelector('body').innerText
    }
}

function getPage(){
    document.querySelector('iframe').src = urlInput()
}

function urlInput(){
    let url = document.getElementById('urlinput').value
    return window.location.origin + '/public/' + url
}

function putPage(){
    let putURL = urlInput()
    fetch(putURL, {
        method: 'PUT',
        body: document.querySelector('textarea').value
    }).then(x => getPage())
}

function main(){
    let frame = document.querySelector('iframe')
    frame.addEventListener('load', getHTML)
    frame.src='/public/'
    document.getElementById('loadButton').addEventListener('click', getPage)
    document.getElementById('saveButton').addEventListener('click', putPage)
}