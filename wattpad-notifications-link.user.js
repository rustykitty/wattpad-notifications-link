// ==UserScript==
// @name     Wattpad Notifications
// @version  1
// @grant    none
// @author 	 rustykitty
// @include  https://www.wattpad.com/*
// ==/UserScript==

/*
Note: Wattpad is weird.
On pages such as / and /notifications, it uses one kind of HTML structure, but on pages such as /user/RustyThunderClan, it uses a different type.
The former type (which I'll call type 1) causes the HTML elements for a dropdown's subitems to appear when I open the dropdown. I use a MutationObserver for this.
The latter type (which I'll call type 2) has the HTML elements for the subitems always there, but shown or hidden. I use a modification on the page load for this.
*/

(function() {
  
  	function parseURL(url) {
    		return new URL(url, location.href).href; 
    }
  
		// https://stackoverflow.com/a/22289650
    function getLeafNodes(master) {
        var results = [];
        var children = master.childNodes;
        for (var i = 0; i < children.length; i++) {
            if (children[i].nodeType == 1) {
                var childLeafs = getLeafNodes(children[i]);
                if (childLeafs.length) {
                    // if we had child leafs, then concat them onto our current results
                    results = results.concat(childLeafs);
                } else {
                    // if we didn't have child leafs, then this must be a leaf
                    results.push(children[i]);
                }
            }
        }
        // if we didn't find any leaves at this level, then this must be a leaf
        if (!results.length) {
            results.push(master);
        }
        return results;
    }

    // could filter more precisely for something like 
    // `div (aria-labelledby="profile-dropdown") > ul > li > a` but this works
  	function isUpdatesLink(element) {
    		return element.nodeName.toLowerCase() === "a" && 
                parseURL(element.getAttribute("href")) === parseURL("/feed") &&
                element.textContent.trim() === "Updates"; 
    }
  	function modifyUpdatesLink(link) {
      	link.setAttribute("href", parseURL("/notifications"));
        link.textContent = "Notifications";
    }
  
 	// In case it's already there, just shown or hidden depending
  	const allNodes = getLeafNodes(document.body);
  	const updatesLinks = allNodes.filter(isUpdatesLink);
  	for (link of updatesLinks) {
    		modifyUpdatesLink(link); 
    }
 
  	// https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver
  	/**
     * @param {Array<MutationRecord>} mutations
    */
    const callback = function(mutations, observer) {
        for (const mutation of mutations) {
            if (mutation.type !== "childList") {
                return; // not a child element modification
            }
            // filter the list
          	// note: Array.from is ES6
            const addedNodes = mutations.flatMap(mutation => Array.from(mutation.addedNodes));
          	const addedLeaves = addedNodes.flatMap(node => getLeafNodes(node));
          	const updatesLinks = addedLeaves.filter(isUpdatesLink);
            // there shouldn't be more than one but in case there is
            for (const link of updatesLinks) {
            		link.setAttribute("href", parseURL("/notifications"));
                link.textContent = "Notifications";
            }
        }
    };
    const observer = new MutationObserver(callback);
    observer.observe(document.body, {childList: true, subtree: true});
})();
