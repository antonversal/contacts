$(function(){
	var Contact = Backbone.Model.extend({
  	defaults: {
    	"name":  "",
    	"surname":     "",
    	"phone":    ""
  	}
	});


	var ContactList = Backbone.Collection.extend({
		model: Contact,
		localStorage: new Backbone.LocalStorage("contacts-backbone"),

		search: function(letters){
			if(letters == "") return this;
		
			var pattern = new RegExp(letters,"gi");
			return _(this.filter(function(data) {
		  		return pattern.test(data.get("name")) || 
		  		pattern.test(data.get("surname")) || 
		  		pattern.test(data.get("phone"));
			}));		
		}
	});

	var Contacts = new ContactList;



	var Group = Backbone.Model.extend({
	});

	var GroupList = Backbone.Collection.extend({
		model: Group,
		localStorage: new Backbone.LocalStorage("groups-backbone"),
	});

	var Groups = new GroupList;

	var ContactView = Backbone.View.extend({
		tagName: "tr",
		template: _.template($('#item-template').html()),

		events: {
      "dblclick .view"  : "edit",
      "click button.destroy" : "clear",
      "keyup .edit"  : "updateOnEnter"
    },

  	initialize: function() {
      this.listenTo(this.model, 'change', this.render);
      this.listenTo(this.model, 'destroy', this.remove);
    },

		render: function() {
			var arrts = this.model.toJSON();
			arrts["group"] = "";
			var group = Groups.findWhere({id: this.model.get("group_id")});
			if (group) {
				arrts["group"] = group.get("name");
				}
      this.$el.html(this.template(arrts)).fadeIn();
      this.name_input = this.$('#name');
      this.surname_input = this.$('#surname');
      this.phone_input = this.$('#phone');
      this.group_input = this.$('#group');
      return this;
    },

    edit: function() {
      this.$el.addClass("editing");
      this.name_input.focus();
    },

    close: function() {
      var name = this.name_input.val();
      var surname = this.surname_input.val();
      var phone = this.phone_input.val();
      var group_name = this.group_input.val();
      var group = Groups.findWhere({name: group_name})
      if (!group) {
      	group = Groups.create({name: group_name});
      }
      // if (!name) {
      //   alert("Name could not be blank!");
      // } else {
        this.model.save({name: name, surname: surname, phone: phone, group_id: group.get("id")});
        this.$el.removeClass("editing");
      //}
    },

    updateOnEnter: function(e) {
      if (e.keyCode == 13) {
      	this.close();
      }
      else if (e.keyCode == 27) {
      	this.$el.removeClass("editing");
      }      	
    },

    clear: function() {
      this.model.destroy();
    }
	})


	var GroupView = Backbone.View.extend({
		tagName: "li",
		template: _.template($('#group-template').html()),

		events: {
      "dblclick .view"  : "edit",
      "keyup .edit"  : "updateOnEnter"      
    },

  	initialize: function() {
      this.listenTo(this.model, 'change', this.render);
      this.listenTo(this.model, 'destroy', this.remove);
    },

		render: function() {			
			var attrs = this.model.toJSON();
			attrs["cid"] = this.model.cid;
      this.$el.html(this.template(attrs)).fadeIn();
      this.name_input = this.$('input.edit');
      return this;
    },

    edit: function() {
      this.$el.addClass("editing");
      this.name_input.focus();
    },

    close: function() {
      var name = this.name_input.val();
       this.model.save({name: name});
       this.$el.removeClass("editing");
    },

    updateOnEnter: function(e) {
      if (e.keyCode == 13) {
      	this.close();
      }
      else if (e.keyCode == 27) {
      	this.$el.removeClass("editing");
      }      	
    },
	});

	var AppView = Backbone.View.extend({
		el: $("#contacts-app"),

		events: {
      "click #new-contact": "newContact",
      "keyup #new-contact-form input"  : "closeForm",
      "keyup #search-form": "searchCollection",
      "click a.group": "filterGroup",      
      "click a.allgroup": "filterAllGroup",
      "click #fake-data": "fakeData"
    },
	  initialize: function() {

     this.listenTo(Contacts, 'add', this.addOne);
     this.listenTo(Contacts, 'reset', this.addAll);
     this.listenTo(Contacts, 'all', this.render);

     this.listenTo(Groups, 'add', this.addOneGroup);
     this.listenTo(Groups, 'reset', this.addAllGroup);
     this.listenTo(Groups, 'all', this.renderGroup);

     Groups.fetch();
     Contacts.fetch();
    },

    render: function() {
    	this.name_input = this.$('#new_name');
      this.surname_input = this.$('#new_surname');
      this.phone_input = this.$('#new_phone');
      this.group_input = this.$('#new_group');
      this.search = this.$('#search-form');
    },

		addOne: function(contact) {
      var view = new ContactView({model: contact});
      this.$("#contact-list ").prepend(view.render().el);
    },

    addAll: function() {
      Contacts.each(this.addOne, this);
    },

		renderGroup: function() {
    
    },

		addOneGroup: function(group) {
      var view = new GroupView({model: group});
      this.$("#group-list").append(view.render().el);
    },

    addAllGroup: function() {
      Groups.each(this.addOneGroup, this);
    },

    newContact: function(){
    	this.$("#new-contact-form").addClass("editing");
    	this.$("#new-contact-form").removeClass("hide");
    	this.name_input.focus();
    },

    close: function(){
    	var name = this.name_input.val();
      var surname = this.surname_input.val();
      var phone = this.phone_input.val();
      var group_name = this.group_input.val();
      var group = Groups.findWhere({name: group_name})
      if (!group) {
      	group = Groups.create({name: group_name});
      }
      Contacts.create({name: name, surname: surname, phone: phone, group_id: group.id});
      this.name_input.val('');
      this.surname_input.val('');
      this.phone_input.val('');
    },

    closeForm: function(e){
        if (e.keyCode == 27) {
        	this.$("#new-contact-form").removeClass("editing");
    			this.$("#new-contact-form").addClass("hide");
        } else if (e.keyCode == 13) {
        	this.close();
        };
    },

    searchCollection: function() {
    	var value = this.search.val();
    	var contacts = Contacts.search(value);
    	this.$("#contact-list").html('');
    	contacts.each(this.addOne, this);    	
    },

    filterGroup: function(e) {
    	var cid = $(e.currentTarget).data("cid");
    	group = Groups.get(cid);
    	this.$("#contact-list").html('');
    	_(Contacts.where({group_id: group.get("id")})).each(this.addOne, this);
    },

    filterAllGroup: function() {    	
    	this.$("#contact-list").html('');
    	this.addAll();    	
    },

    fakeData: function() {
      var group1 = Groups.create({name: "Favorite"});
      var group2 = Groups.create({name: "Friends"});
      var group3 = Groups.create({name: "Co-Workers"});
      Contacts.create({name: "Masha", surname: "Bulkina", phone: "067 777 87 97", group_id: group1.get("id")});
      Contacts.create({name: "Petya", surname: "Sidorov", phone: "067 333 37 97", group_id: group2.get("id")});
      Contacts.create({name: "Vasya", surname: "Pupkin", phone: "067 456 67 97", group_id: group2.get("id")});
      Contacts.create({name: "John", surname: "Doe", phone: "067 767 68 97", group_id: group3.get("id")});
      Contacts.create({name: "Mr", surname: "Smith", phone: "067 234 87 95", group_id: group3.get("id")});
    }
	});

	 var App = new AppView;	 
});