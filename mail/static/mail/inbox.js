document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // Waiting for the click on submit button
  document.querySelector('#compose-form').addEventListener('submit', send_mail);
  
  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#emails-details').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = ''; 
}

// Send mail
function send_mail (event) {
  // Prevent for loading inbox
  event.preventDefault();    
  // Send function
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: document.querySelector('#compose-recipients').value,
        subject: document.querySelector('#compose-subject').value,
        body: document.querySelector('#compose-body').value
    })
  })
  .then(response => response.json())
  .then(result => {
    // Print result
    console.log(result);
  })
  .then(() => {
    load_mailbox('sent')
  })  
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#emails-details').style.display = 'none';

  // Query for the latest emails
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {      
    emails.forEach(email => {
      const element = document.createElement('div');   
      
      // Select style for read/unread emails     
      if (email.read == true) {
        element.className = "boxread";
      } else {
        element.className = "boxunread";
      }
      
      element.innerHTML = "<strong>" + "<span class=\'sender\'>" + email['sender'] + 
      "</span>" + "</strong>" + "<span class=\'subject\'>" + email['subject'] +  
      "</span>" + "<span class=\'timestamp\'>" + email['timestamp'] +  "</span>" + "<br>";

      document.querySelector('#emails-view').append(element);
        
      // Show clicked email
      element.addEventListener('click', function() {
        console.log('This element has been clicked!')
        
        document.querySelector('#emails-view').style.display = 'none';
        
        fetch(`/emails/${email['id']}`)
        .then(response => response.json())
        .then(email => {           
          document.querySelector('#emails-details').style.display = 'block';
          const element = document.createElement('div');
          const reply = document.createElement('button');
          reply.innerHTML = "<button class=\"btn btn-sm btn-outline-primary\" id=\"reply\">Reply</button>";
          const archive = document.createElement('button');
          archive.innerHTML = "<button class=\"btn btn-sm btn-outline-primary\" id=\"archive\">Archive</button>";
          const unarchive = document.createElement('button');
          unarchive.innerHTML = "<button class=\"btn btn-sm btn-outline-primary\" id=\"unarchive\">Unarchive</button>";
          element.innerHTML = "<strong>" + "From: " + "</strong>" + email['sender'] + "<br/>" + 
          "<strong>" + "To: " + "</strong>" + email['recipients'] + "</br>" + 
          "<strong>" + "Subject: " + "</strong>" + email['subject'] + "<br>" +
          "<strong>" + "Timestamp: " + "</strong>" + email['timestamp'] + "<br>";

          if (mailbox == 'inbox') {
            document.querySelector('#emails-details').innerHTML = element.innerHTML + reply.innerHTML + 
            "  " + archive.innerHTML + "<hr>" + email['body'];
            // Achive the message
            document.querySelector('#archive').addEventListener('click', function () {
              fetch(`/emails/${email['id']}`, {
                method: 'PUT',
                body: JSON.stringify({
                  archived: true
                })
              })
              .then(() => {
                load_mailbox('inbox')
              })
            })
            // Reply to the message
            document.querySelector('#reply').addEventListener('click', function () {
              compose_email();  
              // Change page title            
              document.querySelector('#compose-view h3').innerHTML = 'Reply';
              // Pre-fill email sender
              document.querySelector('#compose-recipients').value = email['sender'];
              // Pre-fill subject line depending on the original email              
              if (email['subject'].slice(0,3) == "Re:") {
                document.querySelector('#compose-subject').value = email['subject'];
              } else {
                document.querySelector('#compose-subject').value = "Re: " + email['subject'];
              }
              // Pre-fill email body
              document.querySelector('#compose-body').value = "On " + email['timestamp'] + " " + email['sender'] + 
              " wrote: " + email['body'] + " ";               
            })

          } else if (mailbox == 'archive') {
            document.querySelector('#emails-details').innerHTML = element.innerHTML + "  " + 
            unarchive.innerHTML + "<hr>" + email['body'];
            // Unarchive the message
            document.querySelector('#unarchive').addEventListener('click', function () {
              fetch(`/emails/${email['id']}`, {
                method: 'PUT',
                body: JSON.stringify({
                  archived: false
                })
              })
              .then(() => {
                load_mailbox('inbox')
              })
            })
          } else {
            document.querySelector('#emails-details').innerHTML = element.innerHTML + "<hr>" + email['body'];
          }                   
          // Mark the message as read
          fetch(`/emails/${email['id']}`, {
            method: 'PUT',
            body: JSON.stringify({
                read: true
            })
          });
        })    
      })          
    })      
  });  
  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`; 
}
