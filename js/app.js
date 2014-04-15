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
			title: 'Note Title',
			date: '',
			description: 'Note Description',
			order: ''
		}

	});


	// Note list collection
	APP.Collections.Notes = Backbone.Collection.extend({
		
		model: APP.Models.Note,

		localStorage: new Backbone.LocalStorage('myNotes'),

		initialize: function() {
			this.listenTo(this, 'add', this.sort);
		},

		// Keep track of the length of this collection so we can assign id properties to notes for ordering
		noteOrder: function() {
	    	if (!this.length) return 1;
	      	return this.first().get('order') + 1;
	    },

	    comparator: function(model) {
	    	return -model.get('order');
	    }

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
			'click .delete': 'deleteNote',
			'resort': 'reorder'
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
			this.model.destroy();
			
			// Display 'you have no notes' message if deleting the last note
			if (noteList.length < 1) {
				$('#welcome-message').addClass('-active');
				$('#instructions').removeClass('-active');
			}
		},

		reorder: function() {
			this.model.save({ order: this.$el.parent().length - this.$el.index() });
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
					order: noteList.noteOrder(),
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
			'click #add-note': 'addNote',
			'sortupdate #note-list': 'reorder' // sortupdate is an event fired when Sortable drag is complete
		},

		initialize: function() {
			this.collection.fetch();
			this.listenTo(noteList, 'add', this.renderNew);
	    	this.render();
		},

		render: function() {
	    	_.each(this.collection.models, function (item) {
	        	var note = new APP.Views.Note({
					model: item
				});
				this.$('#note-list').append(note.render().el);
	    	}, this);

	    	this.makeSortable();

	    	if (this.collection.length < 1) {
	    		$('#welcome-message').addClass('-active');
	    	}
		},

		renderNew: function(note) {
			var newNote = new APP.Views.Note({ model: note });
			this.$('#note-list').prepend(newNote.render().el);

			this.makeSortable();

			// Hide 'you have no notes' message once a note exists
			if(this.collection.length > 0) {
	    		this.$('#welcome-message').removeClass('-active');
	    		this.$('#instructions').addClass('-active');
	    	}
		},

		addNote: function(e) {
			e.preventDefault();
			var newNoteView = new APP.Views.AddNote();
			$('#new-note').reveal();
		},

		makeSortable: function() {
			var $el = $('#note-list');

			if (this.collection.length) {
				$el.sortable(); 
			}
		},

		// Trigger a resort event for the individual note view to listen for
		reorder: function(event) {
			this.$('#note-list>li').trigger('resort');
		}

	});


	APP.notesApp = new APP.Views.Main({ collection: noteList });

}) ();
