const likeBtn = document.querySelector('#material-like-button')
const commentForm = document.querySelector('.material-comment-form');
const likeCounter = document.querySelector('#material-like-count')
const replyBtns = document.querySelectorAll('.reply-btn');
const commentLikeIcons = document.querySelectorAll('.like-icon i')
const commentField = document.querySelector('.material-comment-field-input');
const commentFieldHidden = document.querySelector('#reply_id');
const postID = commentForm.dataset.postid;
const showReplyBtns = document.querySelectorAll('.show-replies-btn');

showReplyBtns.forEach(btn => {  
    btn.addEventListener('click', function() {
        const commentId = this.dataset.commentId;
        const repliesCount = this.dataset.repliesCount
        const replyDiv = document.getElementById(`comment-reply-${commentId}`);
        replyDiv.style.display = replyDiv.style.display === 'block' ? 'none' : 'block';
        this.innerHTML = replyDiv.style.display === 'block' ? '&mdash;&mdash; Hide replies' : `&mdash;&mdash; View replies (${repliesCount})`;
    })
});

likeBtn.addEventListener('click', handleLikes)

commentForm.addEventListener('submit', handleSubmit); 

commentLikeIcons.forEach(icon => {
    icon.addEventListener('click', handleLikesComment)
});

replyBtns.forEach(btn => {
    btn.addEventListener('click', handleReply);
});

function handleLikes() {
    const post_id = this.dataset.postId;
    let count = parseInt(likeCounter.dataset.postLikes);
  
    fetch(`/like-post/${post_id}`)
    .then(response => response.json())
    .then(data => {
        if (data['liked']) {
            likeCounter.innerHTML = `${count + 1} likes`;
            likeCounter.dataset.postLikes = count + 1;
            likeBtn.setAttribute('class', 'fa-solid fa-heart');
            likeBtn.style.color = 'red'
        }
        else {
            likeCounter.innerHTML = `${count - 1} likes`;
            likeCounter.dataset.postLikes = count - 1;
            likeBtn.setAttribute('class', 'fa-regular fa-heart');
            likeBtn.style.color = 'black'
        }
    })
}

function handleLikesComment() {
    const comment_id = this.dataset.commentId;
    const counter = document.getElementById(`like-counter-${comment_id}`);
    let count = parseInt(counter.dataset.count);

    fetch(`/like-comment/${comment_id}`)  
    .then(response => response.json())
    .then(data => {
        if (data['liked']) {
            counter.innerHTML = `${count + 1} likes`;
            counter.dataset.count = count + 1;
            this.setAttribute('class', 'fa-solid fa-heart');
            this.style.color = 'red';
            counter.style.display = 'block';
        }
        else {
            counter.innerHTML = `${count - 1} likes`;
            counter.dataset.count = count - 1;
            if (counter.dataset.count == 0) {
                counter.style.display = 'none';
            }
            this.setAttribute('class', 'fa-regular fa-heart');
            this.style.color = 'black';
        }
    })
}

function handleReply() {
    commentField.value = '';
    const commentId = this.dataset.commentId;
    const author = this.dataset.author;
    commentField.value += '@' + author + ' ';
    commentField.focus();
    commentFieldHidden.value = commentId;
}

function handleSubmit(event) {
    event.preventDefault();
    const formData = new FormData(this);
    const textareaValue = formData.get('content');
    const parentId = formData.get('reply_id');
  
    // Create the payload
    const payload = {
        textAreaData: textareaValue,
        parent_id: parentId
    };
  
    // Send a POST request to the route using AJAX
    fetch(`/post/${postID}/comment`, {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(comment => {
        // Create a new comment element and add it to the comments list
        const commentElement = document.createElement('div');
        commentElement.classList.add('comment-container');    
        commentElement.innerHTML = `
            <div>
                <img class="user-pic" src="/static/pics/default.jpg" alt="User profile picture">
            </div>
            <div class="user-info">
                <div class="header">
                    <div class="username">${comment["author"]}</div>
                        ${comment.parent ? `<a href="url_for('users.user_profile', username=comment.parent)}" style="color: rgb(53, 152, 157)">@${comment.parent}</a>` : ''}
                    <div class="comment">${comment["content"]}</div>
                </div>
                <div class="footer">
                    <div class="date">${comment["date_posted"]}</div>
                    ${comment["likes_count"] > 0 ? `<div class="date" id="like-counter-${comment["id"]} data-count="${comment["likes_count"]}" style="display: block">${comment["likes_count"]} likes_count</div>` : `<div class="date" id="like-counter-${comment["likes_count"]}" data-count="${comment["likes_count"]}" style="display: none;">${comment["likes_count"]} likes</div>`}
                    <div class="reply-btn" data-comment-id="${comment["id"]}" data-author="${comment["author"]}">Reply</div>
                </div>
            </div>
        `;
        const parentDiv = document.getElementById(`comment-reply-${parentId}`)
        if (parentDiv) {
            parentDiv.appendChild(commentElement)
            const showRepliesBtn = document.getElementById(`show-replies-btn-${parentId}`)
            showRepliesBtn.style.display = 'block';
            let count = showRepliesBtn.dataset.repliesCount;
            count ++;
            showRepliesBtn.dataset.repliesCount = count;
            showRepliesBtn.innerHTML = `&mdash;&mdash; View replies (${count})`;
            parentDiv.style.display = 'block';
        }
        else {
            const commentsList = document.querySelector('.comments');
            commentsList.appendChild(commentElement);
        }
       
        // Clear the content of the comment form
        this.reset();
    });
  }