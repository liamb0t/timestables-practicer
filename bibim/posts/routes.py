from flask import Blueprint, url_for, redirect, request, jsonify, flash, render_template
from flask_login import current_user, login_required
from bibim import db
from bibim.posts.forms import PostForm, MessageForm
from bibim.models import Post, Comment, User, Message, Notification
import datetime

posts = Blueprint('posts', __name__)

@posts.route("/posts/<int:page>", methods=["POST", "GET"])
def load_posts(page):
    posts_per_page = 5
    offset = (page - 1) * posts_per_page
    posts = Post.query.order_by(Post.date_posted.desc()).offset(offset).limit(posts_per_page).all()
    return jsonify({
        'posts':  [post.serialize() for post in posts]
    })

@posts.route("/like-post/<int:post_id>")
@login_required
def like_post(post_id):
    post = Post.query.filter_by(id=post_id).first_or_404()
    if current_user.has_liked_post(post):
        current_user.unlike_post(post)
        db.session.commit()
    else:
        current_user.like_post(post)
        db.session.commit()
    return jsonify({
        'liked': current_user.has_liked_post(post)
    })

@posts.route("/post/<int:post_id>/comment", methods=["POST"])
@login_required
def post_comment(post_id):
    data = request.get_json()
    content = data["textAreaData"]
    post = Post.query.get(post_id)
    comment = Comment(content=content, post=post, commenter=current_user)
    db.session.add(comment)
    db.session.commit()
    return jsonify({
        'content': comment.content,
        'date_posted': comment.date_posted.strftime('%Y-%m-%d'),
        'author': current_user.username
    })

@posts.route("/send_message/<string:recipient>", methods=["GET", "POST"])
@login_required
def send_message(recipient):
    user = User.query.filter_by(username=recipient).first_or_404()
    form = MessageForm()
    if form.validate_on_submit():
        new_messages_count = user.new_messages()
        user.add_notification('unread_message_count', new_messages_count + 1)
        msg = Message(author=current_user, recipient=user,
                      body=form.body.data)
        db.session.add(msg)
        db.session.commit()
        flash(('Your message has been sent.'))
        return redirect(url_for('users.user_profile', username=recipient))
    return render_template('send_message.html', form=form, recipient=recipient)


@posts.route("/read_message/<int:message_id>")
@login_required
def read_message(message_id):
    user = current_user
    message = Message.query.filter_by(id=message_id).first_or_404()
    message.read = True
    current_user.add_notification('unread_message_count', user.new_messages())
    db.session.commit()
    return render_template('read_message.html', message=message)


@posts.route("/inbox")
@login_required
def inbox():
    current_user.last_message_read_time = datetime.datetime.utcnow()
    current_user.add_notification('unread_message_count', 0)
    db.session.commit()
    page = request.args.get('page', 1, type=int)
    messages = current_user.messages_received.order_by(
        Message.timestamp.desc()).paginate(
            page=page, per_page=2,
            error_out=False)
    next_url = url_for('posts.inbox', page=messages.next_num) \
        if messages.has_next else None
    prev_url = url_for('posts.inbox', page=messages.prev_num) \
        if messages.has_prev else None
    return render_template('inbox.html', messages=messages.items,
                           next_url=next_url, prev_url=prev_url)


@posts.route('/notifications')
@login_required
def notifications():
    since = request.args.get('since', 0.0, type=float)
    notifications = current_user.notifications.filter(
        Notification.timestamp > since).order_by(Notification.timestamp.asc())
    return jsonify([{
        'name': n.name,
        'data': n.get_data(),
        'timestamp': n.timestamp
    } for n in notifications])