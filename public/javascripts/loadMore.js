
const campList = document.getElementById('campList');
const loadMoreBtn = document.getElementById('loadMoreBtn');
let offset = 5;

function loadMoreCamps() {

    fetch(`/campgrounds/loadmore/${offset}`)
        .then(response => response.json())
        .then(data => {

            const nextCampgrounds = data.nextCampgrounds;
            const isLastPage = data.isLastPage;

            if (isLastPage) {
                loadMoreBtn.setAttribute('hidden', true);
            }

            nextCampgrounds.forEach(campground => {

                console.log(campground);
                const nextCampground = document.createElement('div');
                nextCampground.classList.add('card', 'mb-3');

                if (campground.images.length > 0) {   // 이 안에서는 몽구스스키마의 가상프로퍼티를 사용할 수가 없어서(이미지리사이즈).. 직접 replace함
                    nextCampground.innerHTML = `
                        <div class="row">
                            <div class="col-md-4">
                                <img class="img-fluid" src="${campground.images[campground.images.length - 1].url.replace('/upload', '/upload/c_fill,h_600,w_800')}" alt="" style="border-radius: 4px;">
                            </div>
                            <div class="col-md-8 d-flex flex-column justify-content-between">
                                <div class="card-body">
                                    <h5 class="card-title">${campground.title}</h5>
                                    <p class="card-text mb-2 cuttoff-text">${campground.description}</p>
                                    <p class="card-text">
                                        <small class="text-muted hide-location">${campground.location}</small>
                                    </p>
                                </div>
                                <div class="d-flex justify-content-end index-btn" style="margin: 0 15px 13px;">
                                    <a class="btn btn-success" href="/campgrounds/${campground._id}">View ${campground.title}</a>
                                </div>
                            </div>
                        </div>
                    `;
                } else {    // 이렇게 전체를 따로 쓰지 않으면 부트스트랩 카드포맷이 망가짐.. 왜그런거임???
                    nextCampground.innerHTML = `
                        <div class="row">
                            <div class="col-md-4">
                                <img class="img-fluid" src="https://res.cloudinary.com/dldtukwsp/image/upload/c_fill,h_600,w_800/v1705779950/Campgrounds/br0r5upml7kcttk9bctt.jpg" alt="" style="border-radius: 4px;">
                            </div>
                            <div class="col-md-8 d-flex flex-column justify-content-between">
                                <div class="card-body">
                                    <h5 class="card-title">${campground.title}</h5>
                                    <p class="card-text mb-2 cuttoff-text">${campground.description}</p>
                                    <p class="card-text">
                                        <small class="text-muted hide-location">${campground.location}</small>
                                    </p>
                                </div>
                                <div class="d-flex justify-content-end index-btn" style="margin: 0 15px 13px;">
                                    <a class="btn btn-success" href="/campgrounds/${campground._id}">View ${campground.title}</a>
                                </div>
                            </div>
                        </div>
                    `;
                }

                campList.appendChild(nextCampground);

            });

            offset += 15;

        });

}

loadMoreCamps();

loadMoreBtn.addEventListener('click', loadMoreCamps);


