// ============================
// Insight Hub Full Frontend JS (Complete)
// ============================

// ==== Global Variables ====
const API = 'https://insight-backend-gubm.onrender.com';
let currentUser = null;
let editingPostId = null;
let openReadPostId = null;
let openQuestionId = null;

// ==== DOM Elements ====
const feed = document.getElementById('feed');
const questionsFeed = document.getElementById('questionsFeed') || document.createElement('div');
const communitiesFeed = document.getElementById('communitiesFeed') || document.createElement('div');
const tagsFeed = document.getElementById('tagsFeed') || document.createElement('div');
const notif = document.getElementById('notification');
const notifText = document.getElementById('notifText');

// Auth elements
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const loginModal = document.getElementById('loginModal');
const authUsername = document.getElementById('authUsername');
const authFullname = document.getElementById('authFullname');
const authEmail = document.getElementById('authEmail');
const authPassword = document.getElementById('authPassword');
const loginSubmit = document.getElementById('loginSubmit');
const signupSubmit = document.getElementById('signupSubmit');

// Posts
const fab = document.getElementById('fab');
const postModal = document.getElementById('postModal');
const postAuthor = document.getElementById('postAuthor');
const postTitle = document.getElementById('postTitle');
const postContent = document.getElementById('postContent');
const postSave = document.getElementById('postSave');
const postImage = document.createElement('input'); postImage.type='file'; postImage.accept='image/*';
postModal.querySelector('.stack').appendChild(postImage);

// Read modal
const readModal = document.getElementById('readModal');
const readTitle = document.getElementById('readTitle');
const readMeta = document.getElementById('readMeta');
const readBody = document.getElementById('readBody');
const commentsBox = document.getElementById('commentsBox');
const commenter = document.getElementById('commenter');
const commentText = document.getElementById('commentText');
const commentPost = document.getElementById('commentPost');
const commentFormWrap = document.getElementById('commentFormWrap');
const commentHint = document.getElementById('commentHint');

// Question modal
const questionModal = document.getElementById('questionModal');
const questionTitle = document.getElementById('questionTitle');
const questionMeta = document.getElementById('questionMeta');
const questionBody = document.getElementById('questionBody');
const answersBox = document.getElementById('answersBox');
const answerText = document.getElementById('answerText');
const answerer = document.getElementById('answerer');
const answerFormWrap = document.getElementById('answerFormWrap');
const answerHint = document.getElementById('answerHint');
const answerPost = document.getElementById('answerPost');

// Communities modal
const communityModal = document.getElementById('communityModal');
const communityName = document.getElementById('communityName');
const communityDesc = document.getElementById('communityDesc');
const communitySave = document.getElementById('communitySave');

// Notifications modal
const notifModal = document.getElementById('notifModal');
const notificationsBox = document.getElementById('notificationsBox');

// ==== Utility Functions ====
const getAuthHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('jwt')}` });
const initials = name => (name || 'U N').split(' ').map(n => n[0]?.toUpperCase()).join('').slice(0,2);
const openModal = el => el.style.display='flex';
const closeModal = el => el.style.display='none';
document.querySelectorAll('.close').forEach(x => x.addEventListener('click', () => closeModal(document.querySelector(x.dataset.close))));
document.querySelectorAll('.modal').forEach(m => m.addEventListener('click', e => { if(e.target===m) closeModal(m); }));
document.getElementById('notifClose')?.addEventListener('click', ()=> notif.style.display='none');
const showNotification = msg => { notifText.textContent=msg; notif.style.display='flex'; };

// ==== WebSocket ====
let socket;
function connectSocket(){
    socket = new WebSocket('wss://insight-backend-gubm.onrender.com/ws');
    socket.onopen = ()=>console.log('WebSocket connected');
    socket.onmessage = event=>{
        const data = JSON.parse(event.data);
        switch(data.type){
            case 'new_post': case 'update_post': case 'delete_post': loadFeed(); break;
            case 'new_comment': if(openReadPostId===data.post_id) openReadModal(openReadPostId,data.post); break;
            case 'new_question': case 'update_question': loadQuestionsFeed(); break;
            case 'new_answer': if(openQuestionId===data.question_id) openQuestionModal(openQuestionId,data.question); break;
            case 'new_like': showNotification('Someone liked your content'); break;
            case 'new_follow': showNotification('You have a new follower'); break;
            case 'new_notification': if(currentUser && data.user_id===currentUser.id) showNotification(data.message); break;
        }
    };
    socket.onclose = ()=>setTimeout(connectSocket,5000);
}
connectSocket();

// ==== Auth ====
async function login(email,password){
    const res = await fetch(`${API}/auth/login`,{
        method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email,password})
    });
    const data = await res.json();
    if(!res.ok) throw new Error(data.error);
    localStorage.setItem('jwt',data.token); currentUser=data.user;
    loginBtn.style.display='none'; logoutBtn.style.display='inline-block';
    closeModal(loginModal); loadFeed(); loadQuestionsFeed(); loadCommunitiesFeed(); loadTagsFeed(); loadNotifications();
}
async function signup(){
    const payload={
        username: authUsername.value.trim(),
        full_name: authFullname.value.trim(),
        email: authEmail.value.trim(),
        password: authPassword.value.trim()
    };
    const res = await fetch(`${API}/auth/signup`,{
        method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)
    });
    const data = await res.json();
    if(!res.ok) throw new Error(data.error);
    await login(payload.email,payload.password);
}
loginBtn.onclick=()=>openModal(loginModal);
logoutBtn.onclick=()=>{
    localStorage.removeItem('jwt'); currentUser=null;
    loginBtn.style.display='inline-block'; logoutBtn.style.display='none';
    commentFormWrap.style.display='none'; commentHint.style.display='block';
};
loginSubmit.onclick=()=>login(authEmail.value,authPassword.value);
signupSubmit.onclick=()=>signup();

// ============================
// Posts
// ============================
fab.onclick=()=>{
    if(!currentUser) return openModal(loginModal);
    editingPostId=null; postAuthor.value=currentUser.username||''; postTitle.value=''; postContent.value=''; openModal(postModal);
};
postSave.onclick=async()=>{
    if(!currentUser) return openModal(loginModal);
    const formData=new FormData();
    formData.append('title',postTitle.value.trim());
    formData.append('content',postContent.value.trim());
    if(postImage.files[0]) formData.append('image',postImage.files[0]);
    const res=await fetch(`${API}/posts${editingPostId?'/'+editingPostId:''}`,{
        method:editingPostId?'PUT':'POST', headers:getAuthHeaders(), body:formData
    });
    const data=await res.json(); if(!res.ok) throw new Error(data.error);
    closeModal(postModal); loadFeed();
    if(socket && socket.readyState===WebSocket.OPEN) socket.send(JSON.stringify({type:editingPostId?'update_post':'new_post',post:data.post}));
};
async function loadFeed(){
    try{
        const res=await fetch(`${API}/posts`,{headers:getAuthHeaders()});
        if(!res.ok) throw new Error(await res.text());
        const posts=await res.json(); feed.innerHTML='';
        posts.forEach(p=>{
            const card=document.createElement('div'); card.className='card';
            const meta=document.createElement('div'); meta.className='meta';
            const av=document.createElement('div'); av.className='avatar'; av.textContent=initials(p.user.username||'U N');
            const who=document.createElement('div'); who.textContent=`${p.user.username||'Unknown'} • ${new Date(p.created_at).toLocaleString()}`;
            meta.append(av,who);
            const h3=document.createElement('h3'); h3.textContent=p.title;
            const preview=document.createElement('div'); preview.className='preview'; preview.textContent=p.content.length>180?p.content.slice(0,180)+'…':p.content;
            if(p.image_url){ const img=document.createElement('img'); img.src=p.image_url; img.style.maxWidth='100%'; img.style.borderRadius='10px'; card.append(img); }
            const actions=document.createElement('div'); actions.className='actions';
            const readBtn=document.createElement('button'); readBtn.className='chip'; readBtn.textContent='📖 Read more'; readBtn.onclick=()=>openReadModal(p.id,p);
            const likeBtn=document.createElement('button'); likeBtn.className='chip'; likeBtn.textContent='❤️ Like'; likeBtn.onclick=()=>likePost(p.id);
            actions.append(readBtn,likeBtn);
            const ownerWrap=document.createElement('span'); ownerWrap.className='owner-actions';
            if(currentUser && currentUser.id===p.user_id){
                const editBtn=document.createElement('button'); editBtn.className='chip'; editBtn.textContent='✏️ Edit'; editBtn.onclick=()=>{
                    editingPostId=p.id; postAuthor.value=p.user.username; postTitle.value=p.title; postContent.value=p.content; openModal(postModal);
                };
                const delBtn=document.createElement('button'); delBtn.className='chip'; delBtn.textContent='🗑️ Delete'; delBtn.onclick=async()=>{
                    if(confirm('Delete this post?')){
                        await fetch(`${API}/posts/${p.id}`,{method:'DELETE',headers:getAuthHeaders()});
                        loadFeed();
                        if(socket && socket.readyState===WebSocket.OPEN) socket.send(JSON.stringify({type:'delete_post',post_id:p.id}));
                    }
                };
                ownerWrap.append(editBtn,delBtn);
            }
            actions.append(ownerWrap); card.append(meta,h3,preview,actions); feed.append(card);
        });
    } catch(err){ feed.innerHTML=`<p style="color:red;">Failed to load feed: ${err.message}</p>`; }
}

// ============================
// Read Modal & Comments
// ============================
async function openReadModal(postId,post){
    openReadPostId=postId;
    readTitle.textContent=post.title;
    readMeta.textContent=`${post.user.username||'Unknown'} • ${new Date(post.created_at).toLocaleString()}`;
    readBody.textContent=post.content; commentsBox.innerHTML=''; commentText.value=''; commenter.value='';
    commentFormWrap.style.display=currentUser?'flex':'none'; commentHint.style.display=currentUser?'none':'block';
    try{
        const res=await fetch(`${API}/comments/post/${postId}`);
        if(!res.ok) throw new Error(await res.text());
        const comments=await res.json();
        if(comments.length===0){ const empty=document.createElement('div'); empty.className='empty'; empty.textContent='No comments yet — be the first!'; commentsBox.append(empty); }
        else comments.forEach(c=>{
            const row=document.createElement('div'); row.className='comment';
            const who=document.createElement('div'); who.className='who'; who.textContent=c.user.username||'Anonymous';
            const text=document.createElement('div'); text.textContent=c.content;
            row.append(who,text);
            if(currentUser && currentUser.id===c.user_id){
                const del=document.createElement('button'); del.className='btn btn-ghost'; del.style.marginTop='.4rem'; del.textContent='Delete';
                del.onclick=async()=>{ await fetch(`${API}/comments/${c.id}`,{method:'DELETE',headers:getAuthHeaders()}); openReadModal(postId,post); };
                row.append(del);
            }
            commentsBox.append(row);
        });
    } catch(err){ console.error(err); }
    commentPost.onclick=async()=>{
        if(!currentUser) return openModal(loginModal);
        const payload={post_id:openReadPostId,content:commentText.value.trim()}; if(!payload.content) return alert('Enter comment');
        const res=await fetch(`${API}/comments`,{method:'POST',headers:{'Content-Type':'application/json',...getAuthHeaders()},body:JSON.stringify(payload)});
        if(!res.ok) throw new Error(await res.text());
        commentText.value=''; openReadModal(openReadPostId,post);
        if(socket && socket.readyState===WebSocket.OPEN) socket.send(JSON.stringify({type:'new_comment',post_id:openReadPostId,post}));
    };
    openModal(readModal);
}

// ============================
// Questions & Answers
// ============================
async function loadQuestionsFeed(){
    try{
        const res = await fetch(`${API}/questions`,{headers:getAuthHeaders()});
        if(!res.ok) throw new Error(await res.text());
        const questions = await res.json();
        questionsFeed.innerHTML='';
        questions.forEach(q=>{
            const card=document.createElement('div'); card.className='card';
            const meta=document.createElement('div'); meta.className='meta';
            const av=document.createElement('div'); av.className='avatar'; av.textContent=initials(q.user.username||'U N');
            const who=document.createElement('div'); who.textContent=`${q.user.username||'Unknown'} • ${new Date(q.created_at).toLocaleString()}`;
            meta.append(av,who);
            const h3=document.createElement('h3'); h3.textContent=q.title;
            const preview=document.createElement('div'); preview.className='preview'; preview.textContent=q.details?.length>180?q.details.slice(0,180)+'…':q.details;
            const actions=document.createElement('div'); actions.className='actions';
            const readBtn=document.createElement('button'); readBtn.className='chip'; readBtn.textContent='💬 View'; readBtn.onclick=()=>openQuestionModal(q.id,q);
            actions.append(readBtn);
            card.append(meta,h3,preview,actions); questionsFeed.append(card);
        });
    } catch(err){ questionsFeed.innerHTML=`<p style="color:red;">Failed to load questions: ${err.message}</p>`; }
}

async function openQuestionModal(questionId,question){
    openQuestionId=questionId;
    questionTitle.textContent = question.title;
    questionMeta.textContent = `${question.user.username||'Unknown'} • ${new Date(question.created_at).toLocaleString()}`;
    questionBody.textContent = question.details || '';
    answersBox.innerHTML=''; answerText.value=''; answerer.value='';
    answerFormWrap.style.display=currentUser?'flex':'none'; answerHint.style.display=currentUser?'none':'block';
    try{
        const res = await fetch(`${API}/answers/question/${questionId}`,{headers:getAuthHeaders()});
        if(!res.ok) throw new Error(await res.text());
        const answers = await res.json();
        if(answers.length===0){
            const empty=document.createElement('div'); empty.className='empty'; empty.textContent='No answers yet — be the first!'; answersBox.append(empty);
        } else {
            answers.forEach(a=>{
                const row=document.createElement('div'); row.className='comment';
                const who=document.createElement('div'); who.className='who'; who.textContent=a.user.username||'Anonymous';
                const text=document.createElement('div'); text.textContent=a.content;
                row.append(who,text);
                if(currentUser && currentUser.id===a.user_id){
                    const del=document.createElement('button'); del.className='btn btn-ghost'; del.style.marginTop='.4rem'; del.textContent='Delete';
                    del.onclick=async()=>{ await fetch(`${API}/answers/${a.id}`,{method:'DELETE',headers:getAuthHeaders()}); openQuestionModal(questionId,question); };
                    row.append(del);
                }
                answersBox.append(row);
            });
        }
    } catch(err){ console.error(err); }
    answerPost.onclick=async()=>{
        if(!currentUser) return openModal(loginModal);
        const payload={question_id:openQuestionId,content:answerText.value.trim()}; if(!payload.content) return alert('Enter answer');
        const res=await fetch(`${API}/answers`,{method:'POST',headers:{'Content-Type':'application/json',...getAuthHeaders()},body:JSON.stringify(payload)});
        if(!res.ok) throw new Error(await res.text());
        answerText.value=''; openQuestionModal(openQuestionId,question);
        if(socket && socket.readyState===WebSocket.OPEN) socket.send(JSON.stringify({type:'new_answer',question_id:openQuestionId,question}));
    };
    openModal(questionModal);
}

// ============================
// Communities
// ============================
async function loadCommunitiesFeed(){
    try{
        const res = await fetch(`${API}/communities`,{headers:getAuthHeaders()});
        if(!res.ok) throw new Error(await res.text());
        const communities = await res.json();
        communitiesFeed.innerHTML='';
        communities.forEach(c=>{
            const card=document.createElement('div'); card.className='card';
            const h3=document.createElement('h3'); h3.textContent=c.name;
            const preview=document.createElement('div'); preview.className='preview'; preview.textContent=c.description;
            const followBtn=document.createElement('button'); followBtn.className='chip'; followBtn.textContent='Follow'; followBtn.onclick=()=>followUser(c.id);
            card.append(h3,preview,followBtn);
            communitiesFeed.append(card);
        });
    } catch(err){ communitiesFeed.innerHTML=`<p style="color:red;">Failed to load communities: ${err.message}</p>`; }
}

communitySave.onclick=async()=>{
    if(!currentUser) return openModal(loginModal);
    const payload={name: communityName.value.trim(), description: communityDesc.value.trim()};
    const res = await fetch(`${API}/communities`,{method:'POST',headers:{'Content-Type':'application/json',...getAuthHeaders()},body:JSON.stringify(payload)});
    if(!res.ok) throw new Error(await res.text());
    closeModal(communityModal); loadCommunitiesFeed();
};

// ============================
// Tags
// ============================
async function loadTagsFeed(){
    try{
        const res = await fetch(`${API}/tags`,{headers:getAuthHeaders()});
        if(!res.ok) throw new Error(await res.text());
        const tags = await res.json();
        tagsFeed.innerHTML='';
        tags.forEach(t=>{
            const chip = document.createElement('button'); chip.className='chip'; chip.textContent=t.name;
            tagsFeed.append(chip);
        });
    } catch(err){ tagsFeed.innerHTML=`<p style="color:red;">Failed to load tags: ${err.message}</p>`; }
}

// ============================
// Likes & Follows
// ============================
async function likePost(postId){
    if(!currentUser) return openModal(loginModal);
    const payload={post_id:postId};
    const res = await fetch(`${API}/likes`,{method:'POST',headers:{'Content-Type':'application/json',...getAuthHeaders()},body:JSON.stringify(payload)});
    if(!res.ok) throw new Error(await res.text());
}

async function followUser(followingId){
    if(!currentUser) return openModal(loginModal);
    const payload={following_id:followingId};
    const res = await fetch(`${API}/follows`,{method:'POST',headers:{'Content-Type':'application/json',...getAuthHeaders()},body:JSON.stringify(payload)});
    if(!res.ok) throw new Error(await res.text());
}

// ============================
// Notifications
// ============================
async function loadNotifications(){
    if(!currentUser) return;
    try{
        const res = await fetch(`${API}/notifications`,{headers:getAuthHeaders()});
        if(!res.ok) throw new Error(await res.text());
        const notifications = await res.json();
        notificationsBox.innerHTML='';
        if(notifications.length===0){ const empty=document.createElement('div'); empty.className='empty'; empty.textContent='No notifications yet'; notificationsBox.append(empty);}
        else notifications.forEach(n=>{
            const row=document.createElement('div'); row.className='comment'; row.textContent=n.message;
            notificationsBox.append(row);
        });
    } catch(err){ console.error(err); }
}

// ============================
// Initial Load
// ============================
if(localStorage.getItem('jwt')) { 
    loadFeed(); 
    loadQuestionsFeed();
    loadCommunitiesFeed();
    loadTagsFeed();
    loadNotifications();
}
