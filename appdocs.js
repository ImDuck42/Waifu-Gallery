function changeTab(event, tabId) {
    // Hide all code examples
    var codeExamples = document.getElementsByClassName("code-example");
    for (var i = 0; i < codeExamples.length; i++) {
        codeExamples[i].style.display = "none";
    }
    
    // Remove 'active' class from all tabs
    var tabs = document.getElementsByClassName("tab");
    for (var i = 0; i < tabs.length; i++) {
        tabs[i].className = tabs[i].className.replace(" active", "");
    }
    
    // Show the selected code example and add 'active' class to the clicked tab
    document.getElementById(tabId).style.display = "block";
    event.currentTarget.className += " active";
}