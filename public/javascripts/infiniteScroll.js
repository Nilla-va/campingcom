const reviewList = document.getElementById('reviewList');
const loading = document.getElementById('loading');
let offset = 5;

function loadMoreReviews() {

    fetch(`/campgrounds/${campground._id}/loadmore/${offset}`)
        .then(response => response.json())
        .then(data => {

            const nextReviews = data.nextReviews
            const currentUser = data.currentUser
            const isLastPage = data.isLastPage;

            nextReviews.forEach(review => {

                const nextReview = document.createElement('div');
                nextReview.classList.add('card', 'mb-3');

                if (currentUser && currentUser._id === review.author._id) {

                    nextReview.innerHTML = `
                        <div class="card-body">
                            <p class="card-text mb-1 starability-result" style="transform: translateX(-4px);" data-rating="${review.rating}">
                                Rated: ${review.rating} stars
                            </p>
                            <p class="card-text mb-2 text-muted"><small>By ${review.author.username}</small></p>
                            <p class="card-text" style="line-height: 1.4em;">${review.body}</p>
                            <div class="d-flex justify-content-end">
                                <form action="/campgrounds/${campground._id}/reviews/${review._id}?_method=DELETE" method="post">
                                    <button class="btn btn-sm btn-warning">Delete</button>
                                </form>
                            </div>
                        </div>
                    `;

                } else {

                    nextReview.innerHTML = `
                        <div class="card-body">
                            <p class="card-text mb-1 starability-result" style="transform: translateX(-4px);" data-rating="${review.rating}">
                                Rated: ${review.rating} stars
                            </p>
                            <p class="card-text mb-2 text-muted"><small>By ${review.author.username}</small></p>
                            <p class="card-text" style="line-height: 1.4em;">${review.body}</p>
                        </div>
                    `;

                }

                reviewList.appendChild(nextReview);

            });

            offset += 10;

            if (isLastPage) {
                console.log('NO MORE REVIEWS!')
                window.removeEventListener('scroll', checkScroll);
            }

            loading.style.display = 'none';
        });

}

function checkScroll() {

    const scrollHeight = document.documentElement.scrollHeight;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const clientHeight = window.innerHeight;

    if (scrollTop + clientHeight >= scrollHeight - 10) {
        loading.style.display = 'block';
        loadMoreReviews();
    }
}

loadMoreReviews();

window.addEventListener('scroll', checkScroll);
