let page = 1;
const postField = document.querySelector('#content');
const submitPostBtn = document.querySelector('#submit');
const overlay = document.querySelector('.overlay');
const popupContainer = document.querySelector('.likes-popup');
const optionsDiv = document.querySelector('.options-popup');
const editor = document.querySelector('.post-editor')
const emojiBox = document.querySelector('emoji-picker')

document.querySelector('#emoji-icon').addEventListener('click', function() {
    if (emojiBox.style.display === 'none' || emojiBox.style.display === '') {
        emojiBox.style.display = 'block'
    }
    else {
        emojiBox.style.display = 'none'
    }
})

document.querySelector('emoji-picker').addEventListener('emoji-click', event => {
    const textarea = document.getElementById('content');
    textarea.value += event.detail.unicode;
});

function paginate(id, btn) {
    const comments = document.querySelectorAll(`#post-comments-${id} .comment-container-hidden`)
    comments.forEach(comment => {
        comment.classList.toggle('comment-container')
    });
    btn.style.display = 'none';
}   

function handleReply(data) {
    const commentId = data["comment_id"];
    const author = data["author"];
    const postId = data["post_id"];
    const commentTextArea = document.getElementById(`post-textarea-${postId}`);
    const hiddenField = document.getElementById(`post-hidden-${postId}`);
    commentTextArea.value = '';
    commentTextArea.value += '@' + author + ' ';
    commentTextArea.focus();
    hiddenField.value = commentId;
}

overlay.addEventListener('click', function() {
    overlay.style.display = 'none';
    popupContainer.style.display = 'none';
    optionsDiv.style.display = 'none';
    editor.style.display = 'none'
    document.body.classList.remove("body-no-scroll");
})

const likersDiv = document.createElement('div');
likersDiv.setAttribute('class', 'likers-div');

document.querySelectorAll('.like-counter').forEach(counter => {
    counter.addEventListener('click', function() {
        createLikesPopup()
    })
});

document.addEventListener('DOMContentLoaded', () =>{
    load();
    
    const replyBtns = document.querySelectorAll('button');
    console.log(replyBtns)  
    replyBtns.forEach(btn => {
        btn.addEventListener('click', handleReply);
    });
});

window.onscroll = () => {
    if (Math.ceil(window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
        load();
    }
}

function load() {
    const loader = document.querySelector(".loader");
    const current_page = page;
    page += 1;
  
    fetch(`posts/${current_page}`)
    .then(response => {
        loader.style.display = "none";
        return response.json() })
    .then(data => {
        data['posts'].forEach(post => {
            add_post(post);
        });
    })
  
}

function handleLikes() {
    const post_id = this.dataset.post_id;
    const icon = document.getElementById(`like-counter-icon-${post_id}`);
    const counter = document.getElementById(`like-counter-${post_id}`);
    let count = parseInt(counter.dataset.count);

    fetch(`like-post/${post_id}`)
    .then(response => response.json())
    .then(data => {
        if (data['liked']) {
            counter.innerHTML = (count === 0) ? '1 like' : `${count + 1} likes`;
            counter.dataset.count = count + 1;
            icon.style.color = 'orange'
        }
        else {
            counter.innerHTML = (count === 1) ? '' : (count === 2) ? '1 like' : `${count - 1} likes`;
            counter.dataset.count = count - 1;
            icon.style.color = 'black'
        }
    })
}

function add_post(post) {
    // Get the container for the posts
    const postContainer = document.querySelector('.posts');
    postContainer.style.minHeight = '100vh';
    
    // Create a new post element
    const newPost = document.createElement('div');
    newPost.classList.add('post');
    
    // Create the header element
    const header = document.createElement('div');
    header.classList.add('post-header');

    // Create the profile pic link and profile pic element
    const picLink = document.createElement('a');
    picLink.href = `/users/${post['author']}`;

    // Create the profile picture element
    const profilePic = document.createElement('img');
    profilePic.src = `static/pics/${post['pic']}`;
    profilePic.classList.add('post-profile-pic');

    picLink.appendChild(profilePic)
    header.insertBefore(picLink, header.firstChild);
    
    // Create the author link and username element
    const authorLink = document.createElement('a');
    authorLink.href = `/users/${post['author']}`;
    
    const username = document.createElement('h2');
    username.classList.add('post-username');
    username.textContent = post['author'];
  
    authorLink.appendChild(username);
    header.appendChild(authorLink);

    // Create span element 
    const span = document.createElement('span');
    span.classList.add('post-span');
    span.innerHTML = '&#8226;'
    header.appendChild(span);
    
    // Create the date posted element
    const datePosted = document.createElement('p');
    datePosted.classList.add('post-date');
    datePosted.textContent = post['date_posted'];
    header.appendChild(datePosted);

    const tabIcon = document.createElement('i')
    tabIcon.setAttribute('class', 'fa fa-ellipsis')
    tabIcon.style.display = 'flex'
    tabIcon.style.marginLeft = 'auto'
    header.appendChild(tabIcon)
    tabIcon.addEventListener('click', function() {
        if (post['author'] != post['current_user']) {
            document.querySelector('.options-editBtn').style.display = 'none'
            document.querySelector('.delete-btn').style.display = 'none'
        }
        else {
            document.querySelector('.options-editBtn').style.display = 'block'
            document.querySelector('.delete-btn').style.display = 'block'
        }
        document.querySelector('.edit-form').action = `/post/${post['id']}/edit`
        document.querySelector('.delete-form').action = `/post/${post['id']}/delete`
        handleEdit(post['id'])
        optionsDiv.style.display = 'flex'
        overlay.style.display = 'block'
        document.body.classList.add("body-no-scroll");
    })
        
    // Create the content element
    const content = document.createElement('div');
    content.classList.add('post-content');
    
    const contentText = document.createElement('p');
    contentText.innerHTML = post['content'].replace(/\n/g, '<br>');
    content.appendChild(contentText);
    contentText.setAttribute('id', `post-content-${post['id']}`)

    
    // Create likes elements
    const likes = document.createElement('div');
    likes.classList.add('post-likes');
    const likesText = document.createElement('p');
    likesText.setAttribute('class', 'like-counter');

    // Displays the pop up for likers of a post 
    likesText.addEventListener('click', function() {
        popupContainer.innerHTML = '';
        const header = document.createElement('h3');
        header.innerHTML = 'Likes';
        popupContainer.appendChild(header);
        post["likers"].forEach(liker => {
            createLikesPopup(liker); 
        });
        popupContainer.style.display = 'flex';
        overlay.style.display = 'block';
        document.body.classList.add("body-no-scroll");
    });
    if (post['likes'] > 0 ) {
        likesText.textContent = (post['likes'] === 1) ? '1 like': `${post['likes']} likes`;
    }
   
   
    const likeButton = document.createElement('i');
    likeButton.setAttribute('class', 'fa-regular fa-heart');
    likeButton.setAttribute('id', `like-counter-icon-${post['id']}`);
    likeButton.dataset.post_id = post['id'];
    if (post['liked']) {
        likeButton.style.color = 'orange';
    }

    likesText.setAttribute('id', `like-counter-${post['id']}`);
    likesText.dataset.count = post['likes'];
    
    likes.append(likeButton);
    likes.appendChild(likesText);
   
    //add function to like button to handle likes on click 
    likeButton.addEventListener('click', handleLikes);
    
    // Create the footer element
    const footer = document.createElement('div');
    footer.classList.add('post-footer');
    
    // Create the comments element **********

    const comments = document.createElement('div');
    comments.classList.add('comments');
    comments.setAttribute('id', `post-comments-${post["id"]}`);
    
    if (post["comments"]) {
        let count = 0;
        let paginated = false;
        const limit = 5;

        post["comments"].forEach(comment => {
            count += 1;
            const commentContainer = document.createElement('div');
            commentContainer.classList.add('comment-container');
            commentContainer.setAttribute('id', `comment-container-${comment['id']}`)

            if (count > limit) {
                commentContainer.setAttribute('class', 'comment-container-hidden');
                if (!paginated) {
                    paginated = true;
                    const container = document.createElement('div');
                    container.setAttribute('class', 'paginate-icon-container')
                    container.innerHTML = `View more comments (${post["comments"].length - limit})`
                    
                    comments.appendChild(container);
                    container.addEventListener('click', function() {
                        paginate(post['id'], this);
                    })
                }
            } 

            const picLink = document.createElement('a');
         
            const userPic = document.createElement('img');
            userPic.classList.add('user-pic');
            if (!comment["deleted"]) {
                userPic.src = `/static/pics/${comment['pic']}`;
                picLink.href = `/users/${comment['author']}`;
            }
            else {
                userPic.src = `/static/pics/default.jpg`;
            }
          
            userPic.alt = "User profile picture";

            picLink.appendChild(userPic)
            commentContainer.appendChild(picLink);

            const userInfo = document.createElement('div');
            userInfo.classList.add('user-info');

            const header = document.createElement('div');
            header.classList.add('header');

            const nameLink = document.createElement('a');
            nameLink.href = `/users/d}`;

            const username = document.createElement('div');
            username.classList.add('username');
            
           
        
            if (!comment["deleted"]) {
                username.textContent = comment["author"];
                nameLink.appendChild(username)
                header.appendChild(nameLink);
            }
         
            const commentContent = document.createElement('div');
            commentContent.classList.add('comment');

            if (!comment["deleted"]) {
                commentContent.textContent = cleanString(comment["content"])
            }
            else {
                commentContent.textContent = 'Comment deleted by user'
            }

         
            header.appendChild(commentContent);

            userInfo.appendChild(header);

            const footer = document.createElement('div');
            footer.classList.add('footer');

            const date = document.createElement('div');
            date.classList.add('date');
            date.textContent = comment["date_posted"];
            footer.appendChild(date);

            const likeCounter = document.createElement('div');
            likeCounter.classList.add('date');
            likeCounter.id = `comment-like-counter-${comment["id"]}`;
            likeCounter.dataset.count = comment["likes_count"];
            likeCounter.textContent = (comment['likes_count'] === 0) ? likeCounter.style.display = "none": (comment['likes_count'] === 1) ? '1 like': `${comment['likes_count']} likes`;
            footer.appendChild(likeCounter);
            
            const replyBtn = document.createElement('div');
            replyBtn.classList.add('reply-btn');
            replyBtn.textContent = "Reply";
            replyBtn.addEventListener('click', function() {
                handleReply({ author: comment["author"], comment_id: comment["id"], post_id: post["id"] });
            });

            const ellipsis = document.createElement('i')
            ellipsis.setAttribute('class', 'fa fa-ellipsis')
            ellipsis.addEventListener('click', function() {
                displayOverlay(comment['id'])
                if (comment['author'] != post['current_user']) {
                    document.querySelector('.options-editBtn').style.display = 'none'
                    document.querySelector('.delete-btn').style.display = 'none'
                }
                else {
                    document.querySelector('.options-editBtn').style.display = 'none'
                    document.querySelector('.delete-btn').style.display = 'block'
                }
            })
            if (!comment["deleted"]) {
                footer.appendChild(replyBtn);
                footer.appendChild(ellipsis);
            }

            userInfo.appendChild(footer);
    
            commentContainer.appendChild(userInfo);

            const commentId = comment['id'];

            const divContainer = document.createElement('div');
            divContainer.setAttribute('class', 'like-btn');

            
            if (!comment["deleted"]) {
                const divIcon = document.createElement('div');
                divIcon.setAttribute('class', 'like-icon');
                const iElement = document.createElement('i');
                iElement.setAttribute('id', 'material-comment-like-icon-' + commentId);
                iElement.setAttribute('class', 'fa-regular fa-heart');
                iElement.setAttribute('data-comment-id', commentId);

                if (comment['liked']) {
                    iElement.style.color = 'orange'
                }

                iElement.addEventListener('click', handleLikesComment)

                divIcon.appendChild(iElement);
                divContainer.appendChild(divIcon);
            }

            commentContainer.appendChild(divContainer)

            comments.appendChild(commentContainer);

            const replies = document.createElement('div');
            replies.setAttribute('class', 'comment-replies');

            replies.style.display = 'none';

            
            if (comment["replies"].length > 0) {
                const showRepliesDiv = document.createElement('div');
                showRepliesDiv.innerHTML = `
                    <btn class="show-replies-btn" id="show-replies-btn-${comment['id']}" style="display: block" data-comment-id="${comment['id']}" data-replies-count="${comment['replies_count']}">&mdash;&mdash; View replies (${comment['replies_count']})</btn>`
                userInfo.append(showRepliesDiv)

                showRepliesDiv.addEventListener('click', function() {
                    replies.style.display = replies.style.display === 'block' ? 'none' : 'block';
                    this.children[0].innerHTML = replies.style.display === 'block' ? '&mdash;&mdash; Hide replies' : `&mdash;&mdash; View replies (${comment['replies_count']})`;
                })

                comment["replies"].forEach(reply => {
                    const replyDiv = document.createElement('div');
                    const content = cleanString(reply["content"])
                    let html;
                    if (!reply["deleted"]) {
                        html = `
                            <div class="comment-container" style="margin-left: 50px;">
                                <div>
                                    <a href="/users/${reply['author']}">
                                        <img class="user-pic" src="/static/pics/${reply['pic']}" alt="User profile picture">
                                    </a> 
                                </div>
                                <div class="user-info">
                                    <div class="header">
                                        <a href="/users/${reply['author']}">
                                            <div class="username">${reply["author"]}</div>
                                        </a>
                                        ${comment['deleted'] ? '' : '<a style="color: #385898;" href="/users/' + reply['parent'] + '">@' + reply['parent'] + '</a>'}

                                        <div class="comment">${content}</div>
                                    </div>
                                    <div class="footer">
                                        <div class="date">${reply["date_posted"]}</div>
                                        
                                        ${reply["likes_count"] > 0 ? `<div class="date" id="comment-like-counter-${reply["id"]} data-count="${reply["likes_count"]}" style="display: block">${reply["likes_count"]} likes</div>` : `<div class="date" id="comment-like-counter-${reply["likes_count"]}" data-count="${reply["likes_count"]}" style="display: none;">${reply["likes_count"]} likes</div>`}
                                        
                                        <div class="date" id="comment-like-counter-${reply["id"]}" data-count="${reply["likes_count"]}" style="display: none;">${reply["likes_count"]} likes</div>
                                        <div onclick="handleReply({ author: '${reply["author"]}', comment_id: ${reply["id"]}, post_id: ${post["id"]} })" class="reply-btn" data-comment-id="${reply['id']}" data-author="${reply['author']}">Reply</div>
                                        <i class="fa fa-ellipsis" onclick="handleEllipsis([${reply['id']}, '${reply['author']}', '${post['current_user']}'])"></i>
                                    </div> 
                                </div>
                                <div class="like-btn">
                                    <div class="like-icon">
                                    ${reply["likes_count"] > 0 ? `<i style="color:orange;" id="material-comment-like-icon-${reply["id"]}" class="fa-regular fa-heart" data-reply-id="${reply['id']}" onclick="handleLikesComment(${reply['id']})"></i>` : `<i id="material-comment-like-icon-${reply["id"]}" class="fa-regular fa-heart" data-reply-id="${reply['id']}" onclick="handleLikesComment(${reply['id']})"></i>`}
                                    </div>
                                </div>
                            </div>    
                        `;
                    }
                    else {
                        html = `
                        <div class="comment-container" style="margin-left: 50px;">
                            <div>
                                <a>
                                    <img class="user-pic" src="/static/pics/default.jpg" alt="User profile picture">
                                </a> 
                            </div>
                            <div class="user-info">
                                <div class="header">
                                    <div class="comment">Comment deleted by user</div>
                                </div>
                                <div class="footer">
                                    <div class="date">${reply["date_posted"]}</div>
                                    
                                    ${reply["likes_count"] > 0 ? `<div class="date" id="comment-like-counter-${reply["id"]} data-count="${reply["likes_count"]}" style="display: block">${reply["likes_count"]} likes</div>` : `<div class="date" id="comment-like-counter-${reply["likes_count"]}" data-count="${reply["likes_count"]}" style="display: none;">${reply["likes_count"]} likes</div>`}
                                    
                                    <div class="date" id="comment-like-counter-${reply["id"]}" data-count="${reply["likes_count"]}" style="display: none;">${reply["likes_count"]} likes</div>
                                </div> 
                            </div>
                        </div>    
                    `;
                    }
                    replyDiv.innerHTML = html;
                    replies.appendChild(replyDiv);
                });
                comments.appendChild(replies)
            }

            });
        }
    
    
    // Create the comment container element
    
    
    // Create the form element
    const commentForm = document.createElement('form');
    commentForm.setAttribute('class', 'comment-form');
    commentForm.dataset.postId = post["id"];
    commentForm.addEventListener('submit', handleSubmit);

    const hiddenField = document.createElement('input');
    hiddenField.setAttribute('id', `post-hidden-${post.id}`);
    hiddenField.type = 'hidden';
    hiddenField.name = 'parent';
    hiddenField.value = '';
    commentForm.appendChild(hiddenField);

    
    // Create the textarea element
    const commentTextArea = document.createElement('textarea');
    commentTextArea.placeholder = 'Add a comment...';
    commentTextArea.setAttribute('name', 'myTextarea');
    commentTextArea.setAttribute('id', `post-textarea-${post.id}`);
    commentTextArea.setAttribute('class', 'lounge-comment-field');

    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.textContent = 'Post';
    submitBtn.style.display = 'none';
    submitBtn.setAttribute('class', 'post-comments-button')

    commentTextArea.addEventListener('input', function() {
        const value = this.value.trim();

        if (value === '') {
            submitBtn.style.display = 'none';
        }
        else {
            submitBtn.style.display = 'block';
        }
    })

   
    
    // Append the submit button to the form
    commentForm.appendChild(commentTextArea);
    commentForm.appendChild(submitBtn);
   
    
    // Append the form element to the comment container element
    comments.appendChild(commentForm);

    
    // Append the header, content, likes, and footer elements to the new post element
    newPost.appendChild(header);
    newPost.appendChild(content);
    newPost.appendChild(likes);
    newPost.appendChild(footer);
    
    // Append the comments element to the footer element
    footer.appendChild(comments);
    
    // Append the new post element to the post container
    postContainer.appendChild(newPost);
}


// Function to create the likes popup
function createLikesPopup(user) {
  // Create the main container div

  // Create the content div
  const contentDiv = document.createElement('div');
  contentDiv.innerHTML = `
        <div class="user-row">
            <img class="profile-pic" src="static/pics/${user['pic']}" alt="User1 Name">
            <span class="username">${user['username']}</span>
            <button class="follow-btn">Follow</button>
        </div>` 
  popupContainer.appendChild(contentDiv);

  // Append the likes popup to the document body
  document.body.appendChild(popupContainer);
}

// Call the function to create the likes popup

function handleEdit(id) {
    document.querySelector('.options-editBtn').addEventListener('click', function() {
        const postHTML = document.querySelector(`#post-content-${id}`).innerHTML
        overlay.style.display = 'block';
        optionsDiv.style.display = 'none';
        editor.style.display = 'flex'
        document.querySelector('#editor_content').value = postHTML;
    })
}


function displayOverlay(id) {
    overlay.style.display = 'block'
    optionsDiv.style.display = 'flex'
    handleDelete(id)
}
  
function handleDelete(id) {
    document.querySelector('.delete-form').addEventListener('submit', function(event) {
      event.preventDefault()
      fetch(`/comment/delete/${id}`, {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json'
        },
    })
        .then(response => response.json())
        .then(function() {
            console.log(document.querySelector(`.comment-container #${id}`))
            comment.innerHTML = ''
            document.querySelector('.modal-dialog').style.display = 'none'
            document.querySelector('overlay').style.display = 'none'
            document.getElementById('deleteModal').classList.remove('show')
        })
    })
    
}

function handleLikesComment(reply_id) {
    let comment_id;
    if (typeof reply_id === 'number') {
        comment_id = reply_id;
    }
    else {
        comment_id = this.dataset.commentId;
    }
    
    const counter = document.getElementById(`comment-like-counter-${comment_id}`);
    let count = parseInt(counter.dataset.count);
    const icon = document.querySelector(`#material-comment-like-icon-${comment_id}`)

    fetch(`/like-comment/${comment_id}`)  
    .then(response => response.json())
    .then(data => {
        if (data['liked']) {
            counter.innerHTML = (count === 0) ? '1 like': `${count + 1} likes`;
            counter.dataset.count = count + 1;
            icon.style.color = 'orange';
            counter.style.display = 'block';
            icon.style.marginRight = '2px'
        }
        else {
            counter.innerHTML = (count === 2) ? '1 like': (count === 1) ? counter.style.display = 'none': `${count - 1} likes`;
            counter.dataset.count = count - 1;
            icon.style.color = 'black';
            
        }
    })
}

function cleanString(string) {
    let splitString = string.split(" ")

    if (splitString[0].startsWith("@")) {
        splitString = splitString.slice(1);
      }

    return splitString.slice(1).join(" ")
}

function handleEllipsis(data) {
    const id = data[0]
    const author = data[1]
    const currentUser = data[2]
    displayOverlay(id)
    if (author != currentUser) {
        document.querySelector('.options-editBtn').style.display = 'none'
        document.querySelector('.delete-btn').style.display = 'none'
    }
    else {
        document.querySelector('.options-editBtn').style.display = 'none'
        document.querySelector('.delete-btn').style.display = 'block'
    }
}

document.querySelector('.profile-pic').addEventListener('click', function() {
    var dropdown = document.querySelector('.profile-dropdown-content');
    if (dropdown.style.display === 'none') {
      dropdown.style.display = 'block';
    } else {
      dropdown.style.display = 'none';
    }
  });