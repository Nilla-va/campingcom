
const floatingBtn = document.getElementById('floatingBtn')

function floatButton() {

    let scrollHeight = document.documentElement.scrollHeight
    let scrollY = window.scrollY
    let innerHeight = window.innerHeight
    // console.log('docuEl.scrollHeight: ', document.documentElement.scrollHeight)
    // console.log('scrollY: ', window.scrollY)
    // console.log('docuEl.scrollTop: ', document.documentElement.scrollTop)
    // console.log('innerHeight: ', window.innerHeight)
    
    if (scrollHeight > innerHeight * 2) {
        floatingBtn.removeAttribute('hidden')
    }
    if (scrollY < innerHeight * 1.1) {
        floatingBtn.setAttribute('hidden', true)
    }

}

window.addEventListener('scroll', floatButton);