$('#slot-search-form').on('submit', function(e) {
  e.preventDefault();
  slotSearch();
});
//This code is binding an event listener to the form with an ID of "slot-search-form" in a web page using jQuery, a popular JavaScript library. The on() method is used to attach an event handler function to the specified element, in this case the form with the ID "slot-search-form". The first argument to on() is the event type that we want to listen for, which in this case is the "submit" event.

//When the form is submitted, the preventDefault() method is called on the event object passed as a parameter to the event listener. This prevents the form from being submitted through the default method (which is typically reloading the page).

//After preventing the default form submission, the slotSearch() function is called. This is likely a custom function defined elsewhere in the code that performs some sort of search functionality specific to the page.

$('#clear-slots').on('click', function(e) {
  $('#slots').html('');
  $('#slots-holder-row').hide();
});

//This code is binding an event listener to an element with an ID of "clear-slots" using jQuery, a popular JavaScript library.

//The on() method is used to attach an event handler function to the specified element, in this case the element with the ID "clear-slots". The first argument to on() is the event type that we want to listen for, which in this case is the "click" event.

//When the element with ID "clear-slots" is clicked, the anonymous callback function passed as the second argument to on() is executed. This function contains two lines of code:

//$('#slots').html(''); - This line of code selects the element with ID "slots" and sets its HTML content to an empty string. This will clear any content that was previously in the element.

//$('#slots-holder-row').hide(); - This line of code selects the element with ID "slots-holder-row" and hides it. This is likely done to remove any visual elements related to the content that was just cleared from the "slots" element.

//Together, these two lines of code clear out and hide any content related to the "slots" element when the "clear-slots" element is clicked.

function slotSearch() {
  clearUI();
  $('#loading-row').show();

  // Grab Slot query parameters from the slot-search-form
  var form = document.getElementById('slot-search-form');
  var slotParams = {};
  for(var i = 0; i < form.length; i++) {
    // Handle date params later
    if (form.elements[i].name.startsWith('date-')) { continue; }
    slotParams[form.elements[i].name] = form.elements[i].value;
  }
  // Appointment start date and appointment end date need to both be set in query parameter 'start'
  slotParams['start'] = {$ge: form.elements['date-start'].value, $lt: form.elements['date-end'].value};

  FHIR.oauth2.ready(function(smart) {
    // Query the FHIR server for Slots
    smart.api.fetchAll({type: 'Slot', query: slotParams}).then(

      // Display Appointment information if the call succeeded
      function(slots) {
        // If any Slots matched the criteria, display them
        if (slots.length) {
          var slotsHTML = '';

          slots.forEach(function(slot) {
            slotsHTML = slotsHTML + slotHTML(slot.id, slot.type.text, slot.start, slot.end);
          });

          renderSlots(slotsHTML);
        }
        // If no Slots matched the criteria, inform the user
        else {
          renderSlots('<p>No Slots Found. Try Harder</p>');
        }
      },

      // Display 'Failed to read Slots from FHIR server' if the call failed
      function() {
        clearUI();
        $('#errors').html('<p>Failed to read Slots from FHIR server</p>');
        $('#errors-row').show();
      }
    );
  });
}
//This code defines a function called slotSearch() that performs a search for available appointments, using a FHIR server API.

//The first two lines of the function are calling the clearUI() function (presumably custom) to clear any previous search results and displaying a loading element to indicate that a search is being performed.

//The function then gets the input parameters for the search from a form with ID "slot-search-form" and constructs a query object named slotParams. The query object is constructed by iterating over all the form elements and adding each one to the slotParams object. Additionally, this function constructs a date range query parameter named start from two input fields on the form.

//The function then uses the FHIR.js library to perform an asynchronous request to the FHIR server API to retrieve a list of Slots matching the search criteria. Upon success, the function iterates over each Slot object returned from the server and generates an HTML representation for each. These HTML representations are combined into a single string and passed to another custom function named renderSlots() which renders the HTML string into the user interface.

//If no Slots are returned from the server, a message indicating that no Slots were found is rendered.

//If the FHIR server request fails, the clearUI() function is called to clear any previous search results, an error message is displayed using $('#errors').html() function, and the function displays an error message to the user.

//Overall, this function is performing an asynchronous search for available appointments using a FHIR server API, updating the UI to indicate progress, and rendering the results (or an error message) into the user interface.
function slotHTML(id, type, start, end) {
  console.log('Slot: id:[' + id + '] type:[' + type + '] start:[' + start + '] end:[' + end + ']');

  var slotReference = 'Slot/' + id,
      prettyStart = new Date(start),
      prettyEnd = new Date(end);

  return "<div class='card'>" +
           "<div class='card-body'>" +
             "<h5 class='card-title'>" + type + '</h5>' +
             "<p class='card-text'>Start: " + prettyStart + '</p>' +
             "<p class='card-text'>End: " + prettyEnd + '</p>' +
             "<a href='javascript:void(0);' class='card-link' onclick='askForPatient(\"" +
               slotReference + '", "' + type + '", "' + prettyStart + '", "' + prettyEnd + "\");'>Book</a>" +
           '</div>' +
         '</div>';
}

function renderSlots(slotsHTML) {
  clearUI();
  $('#slots').html(slotsHTML);
  $('#slots-holder-row').show();
}

function clearUI() {
  $('#errors').html('');
  $('#errors-row').hide();
  $('#loading-row').hide();
  $('#slots').html('');
  $('#slots-holder-row').hide();
  $('#appointment').html('');
  $('#appointment-holder-row').hide();
  $('#patient-search-create-row').hide();
  clearPatientUI();
}
;
$('#clear-appointment').on('click', function(e) {
  $('#appointment').html('');
  $('#appointment-holder-row').hide();
});

function appointmentCreate(slotReference, patientReference) {
  clearUI();
  $('#loading-row').show();

  var appointmentBody = appointmentJSON(slotReference, patientReference);

  // FHIR.oauth2.ready handles refreshing access tokens
  FHIR.oauth2.ready(function(smart) {
    smart.api.create({resource: appointmentBody}).then(

      // Display Appointment information if the call succeeded
      function(appointment) {
        renderAppointment(appointment.headers('Location'));
      },

      // Display 'Failed to write Appointment to FHIR server' if the call failed
      function() {
        clearUI();
        $('#errors').html('<p>Failed to write Appointment to FHIR server</p>');
        $('#errors-row').show();
      }
    );
  });
}

function appointmentJSON(slotReference, patientReference) {
  return {
    resourceType: 'Appointment',
    slot: [
      {
        reference: slotReference
      }
    ],
    participant: [
      {
        actor: {
          reference: patientReference
        },
        status: 'needs-action'
      }
    ],
    status: 'proposed'
  };
}

function renderAppointment(appointmentLocation) {
  clearUI();
  $('#appointment').html('<p>Created Appointment ' + appointmentLocation.match(/\d+$/)[0] + '</p>');
  $('#appointment-holder-row').show();
}

$('#patient-search-form').on('submit', function(e) {
  e.preventDefault();
  patientSearch();
});

$('#patient-create-form').on('submit', function(e) {
  e.preventDefault();
  patientCreate();
});

$('#clear-patients').on('click', function(e) {
  $('#patients').html('');
  $('#patients-holder-row').hide();
});

function askForPatient(slotReference, type, start, end) {
  clearUI();
  $('#patient-search-create-row').show();

  $('#patient-search-create-info').html(
    '<p>To book Appointment [' + type + '] on ' + new Date(start).toLocaleDateString() +
    ' at ' + new Date(start).toLocaleTimeString() + ' - ' + new Date(end).toLocaleTimeString() +
    ', select a Patient.</p>'
  );
  sessionStorage.setItem('slotReference', slotReference);
}

function patientSearch() {
  clearPatientUI();
  $('#patient-loading-row').show();

  var form = document.getElementById('patient-search-form');
  var patientParams = {name: form.elements[0].value};

  FHIR.oauth2.ready(function(smart) {
    smart.api.fetchAll({type: 'Patient', query: patientParams}).then(

      // Display Patient information if the call succeeded
      function(patients) {
        // If any Patients matched the criteria, display them
        if (patients.length) {
          var patientsHTML = '',
              slotReference = sessionStorage.getItem('slotReference');

          patients.forEach(function(patient) {
            var patientName = patient.name[0].given.join(' ') + ' ' + patient.name[0].family;
            patientsHTML = patientsHTML + patientHTML(slotReference, patient.id, patientName);
          });

          form.reset();
          renderPatients(patientsHTML);
        }
        // If no Patients matched the criteria, inform the user
        else {
          renderPatients('<p>No Patients found for the selected query parameters.</p>');
        }
      },

      // Display 'Failed to read Patients from FHIR server' if the call failed
      function() {
        clearPatientUI();
        $('#patient-errors').html('<p>Failed to read Patients from FHIR server</p>');
        $('#patient-errors-row').show();
      }
    );
  });
}

function patientHTML(slotReference, patientId, patientName) {
  console.log('Patient: name:[' + patientName + ']');

  var patientReference = 'Patient/' + patientId;

  return "<div class='card'>" +
           "<div class='card-body'>" +
             "<h5 class='card-title'>" + patientName + '</h5>' +
             "<a href='javascript:void(0);' class='card-link' onclick='appointmentCreate(\"" +
               slotReference + '", "' + patientReference + "\");'>Use Patient</a>" +
           '</div>' +
         '</div>';
}

function patientCreate() {
  clearPatientUI();
  $('#patient-loading-row').show();

  // Grab Patient POST body attributes from the patient-create-form
  var form = document.getElementById('patient-create-form');

  var patientBody = patientJSON(
    form.elements['patient-create-firstname'].value,
    form.elements['patient-create-middlename'].value,
    form.elements['patient-create-lastname'].value,
    form.elements['patient-create-phone'].value,
    form.elements['patient-create-male'].checked ? 'male' : 'female',
    form.elements['patient-create-birthdate'].value
  );

  // FHIR.oauth2.ready handles refreshing access tokens
  FHIR.oauth2.ready(function(smart) {
    smart.api.create({resource: patientBody}).then(

      // Display Patient information if the call succeeded
      function(patient) {
        $('#patient-loading-row').hide();
        form.reset();
        alert('Created Patient ' + patient.headers('Location').match(/\d+$/)[0] + '\n\nSearch for them by name.');
      },

      // Display 'Failed to write Patient to FHIR server' if the call failed
      function() {
        $('#patient-loading-row').hide();
        alert('Failed to write Patient to FHIR server');
      }
    );
  });
}

function patientJSON(firstName, middleName, lastName, phone, gender, birthDate) {
  var periodStart = new Date().toISOString();

  return {
    resourceType: 'Patient',
    identifier: [
      {
        assigner: {
          reference: 'Organization/675844'
        }
      }
    ],
    active: true,
    name: [
      {
        use: 'official',
        family: [
          lastName
        ],
        given: [
          firstName,
          middleName
        ],
        period: {
          start: periodStart
        }
      }
    ],
    telecom: [
      {
        system: 'phone',
        value: phone,
        use: 'home'
      }
    ],
    gender: gender,
    birthDate: birthDate
  };
}

function renderPatients(patientsHTML) {
  clearPatientUI();
  $('#patients').html(patientsHTML);
  $('#patients-holder-row').show();
}

function clearPatientUI() {
  $('#patient-errors').html('');
  $('#patient-errors-row').hide();
  $('#patient-loading-row').hide();
  $('#patients').html('');
  $('#patients-holder-row').hide();
}
