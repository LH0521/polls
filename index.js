const firebaseConfig = {
    apiKey: "AIzaSyDUB3JeqnvaKUyFvhLQ-evwLUfyNiD6MJU",
    authDomain: "polls-a48e9.firebaseapp.com",
    projectId: "polls-a48e9",
    storageBucket: "polls-a48e9.appspot.com",
    messagingSenderId: "497883484409",
    appId: "1:497883484409:web:0f430f5861017fa1bc9228"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

document.getElementById('login').addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then(result => {
            const user = result.user;

            document.getElementById('auth-section').style.display = 'none';
            document.getElementById('app-section').style.display = 'block';

            document.getElementById('picture').src = user.photoURL || 'default-avatar.png';
            document.getElementById('username').textContent = user.displayName;

            loadPolls(user);
        })
        .catch(error => console.log(error));
});

document.getElementById('logout').addEventListener('click', () => {
    auth.signOut().then(() => {
        document.getElementById('auth-section').style.display = 'flex';
        document.getElementById('app-section').style.display = 'none';
    });
});

auth.signInWithPopup(provider)
    .then(result => {
        const user = result.user;

        document.getElementById('auth-section').style.display = 'none';
        document.getElementById('app-section').style.display = 'block';
        document.getElementById('picture').src = user.photoURL || 'default-avatar.png';
        document.getElementById('username').textContent = user.displayName;

        loadPolls(user);
    })
    .catch(error => console.log(error));


function loadPolls(user) {
    db.collection('Polls').get().then(snapshot => {
        const pollList = document.getElementById('poll-list');
        pollList.innerHTML = '';

        snapshot.forEach(doc => {
            const pollData = doc.data();

            pollList.innerHTML += `
                <div class="card mb-4">
                    <div class="card-body">
                        <div class="d-flex align-items-center mb-4">
                            <div class="flex-1">
                                <span class="d-block font-semibold text-sm text-heading">${pollData.Info.PollQuestion}</span>
                            </div>
                            <button type="button" class="btn btn-sm btn-neutral rounded-pill" data-bs-toggle="offcanvas" data-bs-target="#details_canvas" onclick="showDetails('${doc.id}')">
                                <i class="bi bi-card-text me-1"></i> Details
                            </button>
                        </div>
                        ${createOptions(doc.id, pollData)}
                    </div>
                </div>`;
        });
    });
}

function createOptions(pollId, pollData) {
    let optionsHTML = '';
    const totalVotes = Object.keys(pollData.Options).reduce((sum, option) => sum + pollData.Options[option].length, 0);

    for (const option in pollData.Options) {
        const votes = pollData.Options[option].length;
        const percent = totalVotes ? (votes / totalVotes) * 100 : 0;

        optionsHTML += `
            <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center">
                    <label class="form-check-label d-flex align-items-center" for="${pollId}_${option}">
                        <input class="form-check-input me-2" type="radio" name="${pollId}_vote" id="${pollId}_${option}" value="${option}" onclick="submitVote('${pollId}', '${option}')">
                        ${option}
                    </label>
                    <span class="small text-muted">(${votes}) ${percent.toFixed(2)}%</span>
                </div>
                <div class="progress mt-2" style="height: 6px;">
                    <div class="progress-bar" role="progressbar" style="width: ${percent}%;" aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100"></div>
                </div>
            </div>`;
    }

    return optionsHTML;
}

function submitVote(pollId, selectedOption) {
    const user = firebase.auth().currentUser;

    if (user) {
        const userId = user.uid;

        db.collection('Polls').doc(pollId).get().then(doc => {
            const pollData = doc.data();
            let previousOption = null;

            for (const option in pollData.Options) {
                if (pollData.Options[option].includes(userId)) {
                    previousOption = option;
                }
            }

            if (previousOption && previousOption !== selectedOption) {
                db.collection('Polls').doc(pollId).update({
                    [`Options.${previousOption}`]: firebase.firestore.FieldValue.arrayRemove(userId)
                });
            }

            db.collection('Polls').doc(pollId).update({
                [`Options.${selectedOption}`]: firebase.firestore.FieldValue.arrayUnion(userId)
            }).then(() => {
                loadPolls(user);
            });
        });
    }
}

function showDetails(pollId) {
    db.collection('Polls').doc(pollId).get().then(doc => {
        const pollData = doc.data();
        document.getElementById('details_question').textContent = pollData.Info.PollQuestion;
        document.getElementById('details_posted').textContent = pollData.Info.PollUploadTime;
        document.getElementById('details_category').textContent = pollData.Info.PollCategories.join(', ');
    });
}

document.querySelector('.form-control').addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    filterPolls(query);
});

function filterPolls(query) {
    db.collection('Polls').get().then(snapshot => {
        const pollList = document.getElementById('poll-list');
        pollList.innerHTML = '';
        snapshot.forEach(doc => {
            const pollData = doc.data();
            if (pollData.Info.PollQuestion.toLowerCase().includes(query)) {
                pollList.innerHTML += `
                    <div class="card mb-4">
                        <div class="card-body">
                            <div class="d-flex align-items-center mb-4">
                                <div class="flex-1">
                                    <span class="d-block font-semibold text-sm text-heading">${pollData.Info.PollQuestion}</span>
                                </div>
                                <button type="button" class="btn btn-sm btn-neutral rounded-pill" data-bs-toggle="offcanvas" data-bs-target="#details_canvas" onclick="showDetails('${doc.id}')">
                                    <i class="bi bi-card-text me-1"></i> Details
                                </button>
                            </div>
                            ${createOptions(doc.id, pollData)}
                        </div>
                    </div>`;
            }
        });
    });
}