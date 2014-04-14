"use strict";

// Notes App
var APP = {

	Models: {},
	Collections: {},
	Views: {}

};

(function() {

	// Individual note model
	APP.Models.Note = Backbone.Model.extend({
		
		defaults: {
			title: 'Title',
			date: '',
			description: 'Desc'
		}

	});


	// Note list collection
	APP.Collections.Notes = Backbone.Collection.extend({
		
		model: APP.Models.Note,

		localStorage: new Backbone.LocalStorage('myNotes'),

	});

	var noteList = new APP.Collections.Notes();

	// Individual article view
	APP.Views.Note = Backbone.View.extend({

		tagName: 'li',

		className: 'note-list__item',

		template: _.template($('#note-template').html()),

		events: {
			'dblclick': 'editNote',
			'click .-update': 'saveChanges',
			'click .-cancel': 'cancelChanges',
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
			this.$el.addClass('editing');
		},

		saveChanges: function() {
			var newTitle = this.$el.find('.note-title-field').val();
			var newDesc = this.$el.find('.note-description-field').val();

			this.model.save({ title: newTitle, description: newDesc });
			this.$el.removeClass('editing');
		},

		cancelChanges: function() {
			this.$el.removeClass('editing');
		},

		deleteNote: function() {
			// if (confirm("Are you sure you want to delete this note?")) {
			// 	this.model.destroy();
			// }
			this.model.destroy();
			return false;
		}

	});


	// Add note view
	APP.Views.AddNote = Backbone.View.extend({

		el: '#new-note',

		template: _.template($('#new-note-template').html()),

		events: {
			'click #save-note': 'saveNote'
		},

		initialize: function() {
			this.render();
		},

		render: function() {
			this.$el.html(this.template);
		},

		remove: function() {
			this.undelegateEvents();
		    this.$el.empty();
		    this.stopListening();
		    return this;
		},

		saveNote: function(e) {
			e.preventDefault();
			var newTitle = this.$el.find('#new-title').val();
			var newDesc = this.$el.find('#new-description').val();
			var createdDate = new Date();
			if (newTitle) {
				var newNote = new APP.Models.Note({
					title: newTitle,
					date: (createdDate.getMonth() + 1) + "/" + createdDate.getDate() + "/" + createdDate.getFullYear(),
					description: newDesc
				});

				noteList.create( newNote );
			}
			$('#new-note').trigger('reveal:close');
			this.remove();
		}

	});


	// Main View
	APP.Views.Main = Backbone.View.extend({

		el: '#notes-app',

		events: {
			'click #add-note': 'addNote'
		},

		initialize: function() {
			this.collection.fetch();
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
			var newNoteView = new APP.Views.AddNote();
			$('#new-note').reveal();
		}

	});


	APP.notesApp = new APP.Views.Main({ collection: noteList });

}) ();
