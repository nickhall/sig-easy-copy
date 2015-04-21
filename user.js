// ==UserScript==
// @name        sig easy copy
// @author      Nick Hall
// @namespace   http://soitgo.es
// @include     https://soitgo.es/
// @include     https://soitgo.es/?*
// @require     http://ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js
// @version     1.1.1
// ==/UserScript==
$(document).ready(function()
{
	easycopy.init();
});

var easycopy = {
	init: function()
	{
		$('#links .date').append('<span class="easycopy"><a href="#" class="ezc-links">x</a> <a href="#" class="ezc-thumbs">+</a></span>');
		$('.easycopy a.ezc-links').click(easycopy.handleClick);
		$('#links').before('<div id="ezc-textcontainer" style="height: 100px; clear: both; margin: 0 20px 20px 20px; padding: 0 !important;"><textarea id="easycopytext" style="width: 922px; height: 98px; padding: 0 !important; margin: 0 !important;">Click the x to the right of each link to get started.\n</textarea></div><div id="ezc-loading" style="position: fixed; bottom: 0; right: 0;">Loading...</div>');
		$('.easycopy a.ezc-thumbs').click(easycopy.thumbsClick);
		$('#ezc-loading').hide();
		$('#easycopytext').focus(function() {$(this).select();});

		//Comment this out if you don't want the top link I guess
		$('body').append('<div id="toTheTop" style="position: fixed; left: 5px; bottom: 5px;"><a href="#">top</a></div>');
		$('#toTheTop').click(function(e)
		{
			e.preventDefault();
			window.scrollTo(0, 0);
		});

		// Another div for status messages
		$('body').append('<div id="ezc-status" style="position: fixed; right: 5px; top: 5px; background-color: #191919 !important;">This should never be seen</div>');
		$('#ezc-status').hide();

		MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
		var observer = new MutationObserver(function(mutations)
		{
			mutations.forEach(function(mutation)
			{
				if (typeof mutation.addedNodes == "object")
				{
					$(mutation.addedNodes).find('.date').each(function()
						{
							$(this).append(' <span class="easycopy"><a href="#" class="ezc-links">x</a> <a href="#" class="ezc-thumbs">+</a></span>');
							$(this).find('.ezc-links').click(easycopy.handleClick);
						});
				}
			});
		});

		// define what element should be observed by the observer
		observer.observe(document, {
			subtree: true,
			childList: true
		});

		// Set up moving the text area on scroll
		var textareaInitialPosition = $('#easycopytext').offset().top - 10;
		$(window).scroll(function()
		{
			if ($(window).scrollTop() > textareaInitialPosition)
			{
				$('#easycopytext').css('position', 'fixed');
				$('#easycopytext').css('top', '10px');
			}
			else
			{
				$('#easycopytext').css('position', '');
				$('#easycopytext').css('top', '');
			}
		});

		// Throw in some custom CSS for voting links
		$('head').append('<style type="text/css">\
			.ezc-flood {\
				color: yellow !important;\
			}\
			.ezc-voted {\
				color: green !important;\
			}\
			.ezc-alreadyvoted {\
				color: red !important;\
			}\
			</style>');

		// Show/hide the link box if we want
		$('#middlebar a:last').after('<button id="ezc-linkToggle">Link Box</button>');
		$('#ezc-linkToggle').click(function(e)
		{
			$('#ezc-textcontainer').toggle('fast');
		});
	},

	handleClick: function(event)
	{
		event.preventDefault();
		var url = $(this).parent().parent().prev().find('.title').parent().attr('href'); // This was being really finnicky
		$(this).parent().parent().prev().find('.title').css("cssText", "color: #FF0000 !important;");
		easycopy.enqueue();
		$.get(url, easycopy.populateURLBox);
		$(this).remove();
	},

	thumbsClick: function(event)
	{
		event.preventDefault();
		var linkID = $(this).parent().parent().prev().find('.title').parent().attr('href').split(':');
		var currentLink = $(this);
		if (currentLink.hasClass('ezc-alreadyvoted') || currentLink.hasClass('ezc-voted'))
		{
			easycopy.displayMessage("Already voted");
			return; // Don't pester the server if we've already voted
		}
		$.ajax('ajax.php?i=link&thank=' + linkID[1]).done(function (msg)
			{
				currentLink.removeClass('ezc-flood');
				currentLink.removeClass('ezc-voted');
				currentLink.removeClass('ezc-alreadyvoted');
				if (msg == 'flood')
				{
					currentLink.addClass('ezc-flood');
					easycopy.displayMessage("Please wait");
					console.log("FLOOD!!!");
				}
				else if (msg)
				{
					easycopy.displayMessage("Vote successful");
					currentLink.addClass('ezc-voted');
					console.log("VOTED");
				} 
				else
				{
					easycopy.displayMessage("Already voted");
					currentLink.addClass('ezc-alreadyvoted');
					console.log("Already voted");
				}

				$(this).css('color', 'red');
			}
			);
	},

	populateURLBox: function(data)
	{
		var linkData = "";
		$(data).find('#links_mega a').each(function() { linkData += $(this).attr('href') + '\n' });
		$('#easycopytext').val($('#easycopytext').val() + linkData);
		easycopy.dequeue();
	},

	loadingCount: 0,

	enqueue: function()
	{
		easycopy.loadingCount++;
		console.log("Current queued: " + easycopy.loadingCount);
		$('#easycopytext').prop('disabled', true);
		$('#easycopytext').css('user-select', 'none');
		$('#ezc-loading').show('fast');
	},

	dequeue: function()
	{
		easycopy.loadingCount--;
		if (easycopy.loadingCount === 0)
		{
			$('#easycopytext').prop('disabled', false);
			$('#easycopytext').css('user-select', 'all');
			$('#ezc-loading').hide('slow');
		}
	},

	displayMessage: function(message)
	{
		$('#ezc-status').text(message);
		$('#ezc-status').show('fast').delay(3000).fadeOut();
	}
}