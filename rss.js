//RSS sample link: 
document.addEventListener("DOMContentLoaded", function() {

    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlString, "text/xml");
    const items = xml.getElementsByTagName("item");

});