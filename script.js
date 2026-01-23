let perfumeBlocks = [];
let currentGender = null;

// Salva la posizione di scroll solo se c'è una sezione gender attiva
window.addEventListener('scroll', () => {
    if (currentGender) {
        localStorage.setItem('scrollPosition', window.scrollY);
    }
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
        const intro = lines.slice(0, 61).join('\n');
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
        if (savedGender && savedGender !== 'null') {
            setTimeout(() => {
                loadGenderContent(savedGender, true); // true = skipScroll
                setTimeout(() => {
                    const savedScrollPosition = localStorage.getItem('scrollPosition');
                    if (savedScrollPosition) {
                        window.scrollTo(0, parseInt(savedScrollPosition));
                    }
                    document.body.classList.remove('loading');
                }, 300);
            }, 100);
        } else {
            document.body.classList.remove('loading');
        }
    })
    .catch(error => {
        document.getElementById('intro-content').innerHTML = '<p>Niente, non si è caricato. Riprova o vai a farti una vita.</p>';
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
        document.getElementById('perfume-content').innerHTML = html;
        
        renderMathInElement(document.getElementById('perfume-content'), {
            delimiters: [
                {left: '$$', right: '$$', display: true},
                {left: '$', right: '$', display: false},
                {left: '\\(', right: '\\)', display: false},
                {left: '\\[', right: '\\]', display: true}
            ]
        });
        
        const content = document.getElementById('perfume-content');
        let allElements = Array.from(content.querySelectorAll('*'));
        perfumeBlocks = [];
        let currentBlock = [];
        
        for (let el of allElements) {
            if (el.tagName === 'PRE' || el.tagName === 'CODE' || el.closest('pre')) {
                continue;
            }
            
            if (el.tagName === 'P' && el.querySelector('strong')) {
                if (!el.querySelector('code')) {
                    if (currentBlock.length > 0) {
                        perfumeBlocks.push(currentBlock);
                    }
                    currentBlock = [el];
                }
            } else if (currentBlock.length > 0 && (el.tagName === 'P' || el.tagName === 'IMG' || el.tagName === 'BR')) {
                if (el.tagName === 'P' && el.querySelector('code')) {
                    // salta questo elemento
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
        }
    })
    .catch(error => {
        document.getElementById('perfume-content').innerHTML = '<p>Niente, non si è caricato. Riprova o vai a farti una vita.</p>';
    });
}

loadIntro();