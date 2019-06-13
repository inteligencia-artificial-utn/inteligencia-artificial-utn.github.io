$(document).ready(function() {
    initializeSketchpad();
});

$("#resetButton").click(function() {
    clearSketchpad();
});

$("#analyzeButton").click(function() {
    var dataArray = convertDrawToArray();
    var output = KragNetwork.analize(dataArray);
    document.getElementById('result').innerText = output.toString();
});