$(window).on("load", function() {


	var styledMapType = new google.maps.StyledMapType(
		[
			{
				"stylers": [
					{
						"hue": "#ff1a00"
					},
					{
						"invert_lightness": true
					},
					{
						"saturation": -100
					},
					{
						"lightness": 33
					},
					{
						"gamma": 0.5
					}
				]
			},
			{
				"featureType": "water",
				"elementType": "geometry",
				"stylers": [
					{
						"color": "#2c3e50"
					}
				]
			},
			{
				"elementType": "labels.icon",
				"stylers": [
					{
						"visibility": "off"
					}
				]
			},
			{
				"featureType": "administrative.land_parcel",
				"elementType": "labels",
				"stylers": [
					{
						"visibility": "off"
					}
				]
			}
		]
	);


	// INITIALIZE MAP
	var latitude = 41.881832;
	var longitude = -87.623177;
	var apiKey = "&key=AIzaSyCUx3j9ka3-b_varlv5Qe4oCGreqFycBEA";
	var map;
	function initMap() {		
		var center = new google.maps.LatLng(latitude,longitude);
		var mapOptions = {
			zoom: 13,
			center: center,
			mapTypeControl: false,
			streetViewControl: false
		}
		map = new google.maps.Map(document.getElementById("map"), mapOptions);
		map.mapTypes.set('styled_map', styledMapType);
		map.setMapTypeId('styled_map');
	}
	initMap();



	//DISPLAY MAP ON SEARCH
	function displayMap(lat, lon) {
		map.setCenter(new google.maps.LatLng(lat,lon));
		map.setZoom(16);
	}

	//DATE RE-ARRANGE
	function handleDate(date) {
		return date.slice(5,7) + "-" + date.slice(8,10) + "-" + date.slice(0,4)
	}
	
	//HANDLE ELLIPSES
	function ellipses(x) {
		if (x.length > 26) {
			return x.slice(0,24) + "...";
		}
		return x;
	}
	

	//SORT BY DATE
	function sortByDate(data) {
		let sorted = data.sort(function(a,b){
			let a1 = a.date;
			let b1 = b.date;
			a1 = a1.slice(0,4) + a1.slice(5,7) + a1.slice(8,10);
			b1 = b1.slice(0,4) + b1.slice(5,7) + b1.slice(8,10);
			return b1 - a1;
		});	
		return sorted;
	}

	//ADD COMMAS TO NUMBER
	function addCommas(num) {
		return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	}

	//CLEAR MARKERS
	function clearMarkers(map) {
		for (j=0; j < mapMarkers.length; j++) {
			mapMarkers[j].setMap(map);
		}	
	}


	//GROUP CRIME DATA - INDEX/LONG/LAT
	let markers;
	function crimeLocales(data) {
		markers = [];
		markers = data.map(function(element, index) {
			let newObj = {};
			newObj.index = index;
			newObj.lat = element.latitude;
			newObj.lon = element.longitude;			
			return newObj;
		});
	}


	//CLOSE ALL ARRESTS
	function closeArrests() {
		for (i=0; i < mapMarkers.length; i++) {
			$("#" + i).removeClass("arrest-open");
			$("#" + i).find(".arrest-triangle").removeClass("arrest-triangle-open");
		}
	}

	//TOGGLE ARRESTS
	function toggleArrest(id) {
		$(id).toggleClass("arrest-open");
		$(id).find(".arrest-triangle").toggleClass("arrest-triangle-open");
	}










	//DISPLAY MARKERS * TO CLEAR THE MARKERS, THEY HAVE TO BE PUT IN A CUSTOM ARRAY - mapMarkers
	let mapMarkers = [];
	function displayMarkers(data) {			
		clearMarkers(null);
		crimeLocales(data);		
		mapMarkers = [];

		for (i=0; i < markers.length; i++) {		
			var marker = new google.maps.Marker({
				position: new google.maps.LatLng(markers[i].lat, markers[i].lon),
				map: map,
				icon: "images/custom-marker.png"
			});			
			addMarkerEvent(marker, i);
		}			
	} //function end





	//ADD CLICK EVENTS FOR MARKERS
	function addMarkerEvent(marker, i) {
		marker.markerIndex = i; //keep track of index
		mapMarkers[i] = marker; //for clearing			
		google.maps.event.addListener(marker, "click", function() { //click						
			if ($("#" + i).hasClass("arrest-open")) {
				resetMarker();
				markerSelect = undefined;
				closeArrests();
			}
			else {
				removeRedMarker(i);		
				resetMarker();
				addBlueMarker(i);
				closeArrests();
				toggleArrest("#" + this.markerIndex);
			}
			//Scroll to that arrest
			var element = document.getElementById(this.markerIndex);
			element.scrollIntoView();
		});
	}













	//GET CRIME DATA
	let radius = 500;
	let dataLimit = 5000;
	function getCrimeData() {	
		$(".list").html("<div class='loading'></div>");
		$(".info").text("Loading...");
		let year = "";
		if ($(".year-selected").text() != "ALL") {
			year = "&year=" + $(".year-selected").text();
			$(".year-display").text($(".year-selected").text());
		} 
		else {
			year = "";
			$(".year-display").text("2001-2018");
		}

		$.ajax({
			type: "GET",
			url: "https://data.cityofchicago.org/resource/6zsd-86xi.json?arrest=true" + year,
			dataType: 'json',
			data: {
				"$limit" : dataLimit,
				"$where" : "within_circle(location," + latitude + "," + longitude + "," + radius + ")"
				//"$$app_token" : "YOURAPPTOKENHERE"
			},
			success: function(data) {
				let sorted = sortByDate(data);
				let html = sorted.map(function(element, index) {
					let date = handleDate(element.date);
					let charge = ellipses(element.primary_type);
					let descrip = element.description;
					let domestic = element.domestic + "";
					let block = element.block;
					let location = element.location_description;
					let caseNum = element.case_number;
					return `
<li class="arrest" id="${index}">
<div class="arrest-display">
<div class="arrest-left">
<div class="date">${date}</div>
<div class="primary">${charge}</div>
</div>							
<div class="arrest-triangle"></div>							
</div>						
<div class="details">
<div class="descrip"><div class="list-bold">DESCRIPTION:</div>${descrip}</div>
<div class="domestic"><div class="list-bold">DOMESTIC VIOLENCE:</div>${domestic.toUpperCase()}</div>
<div class="block"><div class="list-bold">BLOCK:</div>${block}</div>
<div class="location"><div class="list-bold">LOCATION:</div>${location}</div>
<div class="case"><div class="list-bold">CASE:</div>#${caseNum}</div>
</div>
</li>`;									
				});
				displayMarkers(sorted);				
				if (sorted.length > 0) {
					$(".info").text(addCommas(sorted.length) + " Arrests");
				} else {
					$(".info").text("No results");
				}
				$(".list").html(html);								
			} //success end
		});
	}







	//GET SEARCH ADDRESS/LAT/LON FOR MAP
	let city = ",+Chicago,+IL"
	function getAddress(address) {
		$.ajax({
			type: "GET",
			url: "https://maps.googleapis.com/maps/api/geocode/json?address=" + address + city + apiKey,
			dataType: 'json',
			success: function(data) {
				latitude = data.results[0].geometry.location.lat;
				longitude = data.results[0].geometry.location.lng;		
				displayMap(latitude, longitude);
				getCrimeData();
			}
		});
	}



	//SEARCH BUTTON
	let address = "";
	$(".search").click(function(){	
		if ($("input[type=text]").val().length > 0) {
			address = $("input[type=text]").val();
			getAddress(address);
		}
	});
	
	$(document).keypress(function(e) {
		if (e.which == 13 && $("input[type=text]").val().length > 0) {
			address = $("input[type=text]").val();
			getAddress(address);
			return false;
		}
	});


	//YEAR BOX OPEN
	$(".year-select").click(function(){
		$(".year-box").toggleClass("year-box-open");
		$(".year-triangle").toggleClass("year-triangle-open");
	});	

	$(".year").click(function(e){
		$(".year-selected").text($(this).text());
	});






	
	
	//REMOVE RED MARKER
	function removeRedMarker(id) {
		mapMarkers[id].setMap(null);
	}
	
	//RESET BLUE MARKER BACK TO RED
	function resetMarker() {
		if (markerSelect != undefined) {
			mapMarkers[markerSelect.markerIndex].setMap(null);
			var marker = new google.maps.Marker({
				position: new google.maps.LatLng(markers[markerSelect.markerIndex].lat, markers[markerSelect.markerIndex].lon),
				map: map,
				icon: "images/custom-marker.png"
			});	
			addMarkerEvent(marker, markerSelect.markerIndex);
		}
	}
	
	//ADD BLUE MARKER
	function addBlueMarker(id) {
		var marker = new google.maps.Marker({
			position: new google.maps.LatLng(markers[id].lat, markers[id].lon),
			map: map,
			icon: "images/custom-marker-select.png",
			zIndex: 5000
		});	
		markerSelect = marker;
		addMarkerEvent(marker, id);
	}
	
	
	
	//ARREST BOX CLICK - THIS WORKS ON DYNAMIC CONTENT. PASSES arrestClick TO THE FUNCTION BELOW
	let arrestClick;
	$(".list").on("click", ".arrest", function(){								
		arrestClick = this;	
	});
	
	
	
	//FOR CHANGING THE ICON ON ARREST CLICK
	let list = document.querySelector(".list");
	let markerSelect;
	google.maps.event.addDomListener(list, "click", function() {
		let id = $(arrestClick).attr("id");
		
		console.log(arrestClick);
		if ($(arrestClick).hasClass("arrest-open")) {
			resetMarker();
			markerSelect = undefined;
			closeArrests();
		}
		else {
			removeRedMarker(id);		
			resetMarker();
			addBlueMarker(id);
			closeArrests();
			toggleArrest(arrestClick);
		}
		
	});
	
	//LEFT PANEL/HALFCIRCLE CLICK - RESPONSIVE
	$(".half-circle").click(function(){
		$(".half-circle").toggleClass("half-circle-open");
		$(".left-panel").toggleClass("left-panel-open");
		$(".slide-triangle").toggleClass("slide-triangle-open");		
	});






});