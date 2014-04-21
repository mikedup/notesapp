"use strict";

// Notes App
var APP = {

	Models: {},
	Collections: {},
	Views: {}

};

$(document).ready(function() {
	// Individual note model
	APP.Models.Note = Backbone.Model.extend({});


	// Tag model
	APP.Models.Tag = Backbone.Model.extend({});


	// Note list collection
	APP.Collections.Notes = Backbone.Collection.extend({
		
		model: APP.Models.Note,

		localStorage: new Backbone.LocalStorage('Notes'),

		initialize: function() {
			this.fetch();
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

	
	// Tag collection
	APP.Collections.Tags = Backbone.Collection.extend({

		model: APP.Models.Tag,

		localStorage : new Backbone.LocalStorage('Tags'),

		initialize: function () {
			this.fetch();
		},

		addTags: function(noteId, tagArray) {
			// Loop through newTags array and create new tag models if they don't exist
			_.each(tagArray, function(tagName) {
        if (tagName === '') return;

				var existingTag = tags.findWhere({ name: tagName });

				// If tag already exists, push new id to notes property
				if (existingTag) {
					var notes = existingTag.get('notes');
					notes.push(noteId);
				} 
				// Otherwise, create a new tag model
				else {
					tags.create({
						name: tagName,
						notes: [noteId]
					});
				}
			}, this);

      // trigger 'tags-added' event on note for main view to re-render
      var note = noteList.get(noteId);
      noteList.trigger('tags-changed', note);
		},

    getNoteTags: function(noteId) {
      var noteTags= [];
      _.each(this.models, function(tag, index, tags) {
        // Grab array of note ids from notes attribute
        var notes = tag.get('notes');

        // Check if it containes noteId. If it does, push tag name attribute to noteTags array
        if (notes.indexOf(noteId) > -1) {
          noteTags.push(tag.get('name'));
        }
      }, this);   

      return noteTags;
    }

	});


	// Individual note view
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
      this.tags = tags.getNoteTags(this.model.get('id'));

			this.listenTo(this.model, 'change', this.render);
			this.listenTo(this.model, 'destroy', this.remove);
		},

		render: function() {
      var noteData = $.extend({}, this.model.attributes, {tags: this.tags});

			this.$el.html(this.template(noteData));
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
			var newTags = this.$el.find('#tags').val().split(' ');
			var createdDate = new Date();
			if (newTitle) {
				// Create new note model
				var newNote = noteList.create({
          order: noteList.noteOrder(),
          title: newTitle,
          date: (createdDate.getMonth() + 1) + "/" + createdDate.getDate() + "/" + createdDate.getFullYear(),
          description: newDesc
        }); 

				// Pass new note id and tags array to the addTags method from tags collection
				var noteId = newNote.get('id');	

				tags.addTags(noteId, newTags);	
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
			this.listenTo(noteList, 'tags-changed', this.renderNew);
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
	    	if(this.collection.length > 0) {
	    		this.$('#instructions').addClass('-active');
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

	APP.noteList = new APP.Collections.Notes();
	var noteList= APP.noteList;
	APP.tags = new APP.Collections.Tags();
	var tags = APP.tags;

	APP.notesApp = new APP.Views.Main({ collection: noteList });

});
