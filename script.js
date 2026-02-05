let perfumeBlocks = [];
let currentGender = null;
let scrollRestoreInProgress = false;

if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}

function saveScrollPosition() {
    if (!scrollRestoreInProgress) {
        localStorage.setItem('scrollPosition', window.scrollY);
    }
}

['visibilitychange', 'pagehide'].forEach(event => {
    window.addEventListener(event, saveScrollPosition);
});

function removeAccents(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function search() {
    const searchInput = document.getElementById('searchInput');
    const query = removeAccents(searchInput.value.toLowerCase().trim());
    const codeBlocks = document.querySelectorAll('#perfume-content pre');
    codeBlocks.forEach(block => {
        block.style.display = query === '' ? '' : 'none';
    });
    const paragraphsWithCode = document.querySelectorAll('#perfume-content p:has(code)');
    paragraphsWithCode.forEach(p => {
        p.style.display = query === '' ? '' : 'none';
    });
    perfumeBlocks.forEach(block => {
        const strongElement = block[0].querySelector('strong');
        const perfumeName = strongElement ? removeAccents(strongElement.textContent.toLowerCase()) : '';
        const visible = query === '' || perfumeName.includes(query);
        block.forEach(el => {
            el.style.display = visible ? '' : 'none';
        });
    });
}

function loadIntro() {
    fetch('intro.md')
    .then(response => response.text())
    .then(markdown => {
        const lines = markdown.split('\n');
        const intro = lines.slice(0, 60).join('\n');
        const html = marked.parse(intro);
        document.getElementById('intro-content').innerHTML = html;
        renderMathInElement(document.getElementById('intro-content'), {
            delimiters: [
                {left: '$$', right: '$$', display: true},
                {left: '$', right: '$', display: false},
                {left: '\\(', right: '\\)', display: false},
                {left: '\\[', right: '\\]', display: true}
            ]
        }); 
        document.getElementById('gender-selection').style.display = 'block';
        const savedGender = localStorage.getItem('currentGender');
        const savedScrollPosition = localStorage.getItem('scrollPosition');
        const restoreScroll = () => {
            if (savedScrollPosition) {
                scrollRestoreInProgress = true;
                const targetPosition = parseInt(savedScrollPosition);
                let intervalId = null;
                let attempts = 0;
                const maxAttempts = 100;   
                const forceScroll = () => {
                    attempts++;
                    window.scrollTo(0, targetPosition);               
                    const currentScroll = window.scrollY;
                    const tolerance = 5;
                    if (Math.abs(currentScroll - targetPosition) <= tolerance || attempts >= maxAttempts) {
                        if (intervalId) {
                            clearInterval(intervalId);
                        }
                        setTimeout(() => {
                            scrollRestoreInProgress = false;
                        }, 500);
                    }
                };
                forceScroll();
                intervalId = setInterval(forceScroll, 100);
            }
        };
        if (savedGender && savedGender !== 'null') {
            loadGenderContent(savedGender, true);
            setTimeout(() => {
                document.body.classList.remove('loading');
                setTimeout(restoreScroll, 200);
            }, 1200);
        } else {
            document.body.classList.remove('loading');
            setTimeout(restoreScroll, 200);
        }
    })
    .catch(error => {
        document.getElementById('intro-content').innerHTML = '<p>Niente, non si è caricato. Riprova o vai a farti una vita.</p>';
        document.body.classList.remove('loading');
    });
}

function loadGenderContent(gender, skipScroll = false) {
    currentGender = gender;
    localStorage.setItem('currentGender', gender);
    const filename = gender === 'donne' ? 'donne.md' : 'uomini.md';
    document.querySelectorAll('.gender-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`btn-${gender}`).classList.add('active');
    fetch(filename)
    .then(response => response.text())
    .then(markdown => {
        const markdownWithSearch = `<div class="search-container">
    <input type="text" id="searchInput" placeholder="Cerca un profumo" oninput="search()">
</div>
${markdown}`;
        const html = marked.parse(markdownWithSearch);
        const content = document.getElementById('perfume-content');
        content.innerHTML = html;
        const childNodes = Array.from(content.childNodes);
        childNodes.forEach(node => {
            if (node.nodeType === 3 && node.textContent.trim().length > 0) {
                const p = document.createElement('p');
                p.textContent = node.textContent;
                content.replaceChild(p, node);
            }
        });
        renderMathInElement(content, {
            delimiters: [
                {left: '$$', right: '$$', display: true},
                {left: '$', right: '$', display: false},
                {left: '\\(', right: '\\)', display: false},
                {left: '\\[', right: '\\]', display: true}
            ]
        });
        let allElements = Array.from(content.querySelectorAll('*'));
        perfumeBlocks = [];
        let currentBlock = [];
        for (let el of allElements) {
            if (el.tagName === 'PRE' || (el.closest('pre'))) {
                continue;
            }
            if (el.tagName === 'P' && el.querySelector('strong')) {
                // Se è un titolo, inizia un nuovo blocco
                if (!el.querySelector('code') && !el.querySelector('.katex')) {
                    if (currentBlock.length > 0) {
                        perfumeBlocks.push(currentBlock);
                    }
                    currentBlock = [el];
                } else {
                    if (currentBlock.length > 0) currentBlock.push(el);
                }
            } 
            else if (currentBlock.length > 0 && (el.tagName === 'P' || el.tagName === 'IMG' || el.tagName === 'BR' || el.tagName === 'DIV')) {
                if (el.tagName === 'P' && el.querySelector('code')) {
                     // salta
                } else {
                    currentBlock.push(el);
                }
            } else if (el.tagName === 'H1' && currentBlock.length > 0) {
                perfumeBlocks.push(currentBlock);
                currentBlock = [];
            }
        }
        if (currentBlock.length > 0) {
            perfumeBlocks.push(currentBlock);
        }
        if (!skipScroll) {
            document.getElementById('perfume-content').scrollIntoView({ behavior: 'smooth' });
        } else {
            const savedScrollPosition = localStorage.getItem('scrollPosition');
            if (savedScrollPosition) {
                scrollRestoreInProgress = true;
                const targetPosition = parseInt(savedScrollPosition);
                setTimeout(() => {
                    let intervalId = null;
                    let attempts = 0;
                    const maxAttempts = 100;
                    const forceScroll = () => {
                        attempts++;
                        window.scrollTo(0, targetPosition);
                        const currentScroll = window.scrollY;
                        const tolerance = 5;                       
                        if (Math.abs(currentScroll - targetPosition) <= tolerance || attempts >= maxAttempts) {
                            if (intervalId) {
                                clearInterval(intervalId);
                            }
                            setTimeout(() => {
                                scrollRestoreInProgress = false;
                            }, 300);
                        }
                    };                   
                    forceScroll();
                    intervalId = setInterval(forceScroll, 100);
                }, 100);
            }
        }
    })
    .catch(error => {
        // console.error(error);
        document.getElementById('perfume-content').innerHTML = '<p>Niente, non si è caricato. Riprova o vai a farti una vita.</p>';
    });
}

loadIntro();