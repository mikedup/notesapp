"use strict";

// Sample Data
var noteData = [
	{ 
  		"title": "App ideas", 
  		"date": "4/9/2014",
  		"description": "Donec pharetra ipsum massa, eget facilisis lorem tempus id. Nunc pretium dui quis mauris posuere venenatis. Proin ut auctor sapien. In ullamcorper tincidunt nisi sed placerat. Sed id justo augue."
  	},
  	{ 
  		"title": "Recipes I need to try", 
  		"date": "4/5/2014",
  		"description": "In hac habitasse platea dictumst. Mauris nec vulputate elit, sit amet tempus tellus. Sed massa nulla, dictum a justo sit amet, pulvinar tempus velit. "
  	},
  	{ 
  		"title": "Meeting notes", 
  		"date": "4/3/2014",
  		"description": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam sed eleifend leo, a luctus neque. Integer ornare a diam at adipiscing. Curabitur lobortis eget risus id tempor."
  	},
  	{ 
  		"title": "Songs to learn on guitar", 
  		"date": "4/2/2014",
  		"description": "ed vel tincidunt magna, id interdum massa. Nunc ac mauris sem. Integer lobortis, lectus quis faucibus molestie, risus justo fermentum elit, in pulvinar ligula risus quis sapien."
  	}
];


// Notes App
var APP = {

	Models: {},
	Collections: {},
	Views: {}

};

(function() {

	// Grab date for later reference
	var date = new Date();

	// Individual note model
	APP.Models.Note = Backbone.Model.extend({
		
		defaults: {
			title: 'Title',
			date: (date.getMonth() + 1) + "/" + date.getDate() + "/" + date.getFullYear(),
			description: 'Desc'
		}

	});


	// Note list collection
	APP.Collections.Notes = Backbone.Collection.extend({
		
		model: APP.Models.Note

	});

	// Create Notes collection with data from sample array
	var noteList = new APP.Collections.Notes( noteData );

	// Individual article view
	APP.Views.Note = Backbone.View.extend({

		tagName: 'li',

		className: 'note-list__item',

		template: _.template($('#note-template').html()),

		events: {
			'click .edit': 'editNote',
			'click .delete': 'deleteNote'
		},

		initialize: function() {
			this.listenTo(this.model, 'change', this.render);
			this.listenTo(this.model, 'destroy', this.remove);
		},

		render: function() {
			this.$el.html(this.template(this.model.toJSON()));
			return this;
		},

		editNote: function(e) {
			e.preventDefault();
			var editableNote = new APP.Views.EditNote({ model: this.model });
			$('#edit-note').reveal();
		},

		deleteNote: function() {
			if (confirm("Are you sure you want to delete this note?")) {
				this.model.destroy();
			}
			return false;
		}

	});


	// Edit article view
	APP.Views.EditNote = Backbone.View.extend({

		el: '#edit-note',

		template: _.template($('#edit-note-template').html()),

		events: {
			'click #save-note': 'saveNote'
		},

		initialize: function() {
			this.render();
		},

		render: function() {
			this.$el.html(this.template(this.model.toJSON()));
		},

		saveNote: function(e) {
			e.preventDefault();
			var newTitle = this.$el.find('#new-title').val();
			var newDesc = this.$el.find('#new-description').val();

			$('#edit-note').trigger('reveal:close');

			// Add logic to only save if there has been a change
			this.model.set({title: newTitle, description: newDesc});
			//this.remove();

		}

	});

	// Add article view
	APP.Views.AddNote = APP.Views.EditNote.extend({

		el: '#add-note',

		template: _.template($('#add-note-template').html())

		// Add new note model before render

	});


	// Main View
	APP.Views.Main = Backbone.View.extend({

		el: '#notes-app',

		events: {
			'click #add-note': 'addNote'
		},

		initialize: function() {
			this.listenTo(noteList, 'add', this.render);
	    	this.render();
		},

		render: function() {
			this.$('#note-list').empty();
	    	_.each(this.collection.models, function (item) {
	        	var note = new APP.Views.Note({
					model: item
				});
				this.$('#note-list').append(note.render().el);
	    	}, this);
		},

		addNote: function(e) {
			e.preventDefault();
			var newNote = new APP.Models.Note();
			noteList.add({ model: newNote });
		}

	});


	var notesApp = new APP.Views.Main({ collection: noteList });

}) ();
