let perfumeBlocks = [];
let currentGender = null;

function search() {
    const searchInput = document.getElementById('searchInput');
    const query = searchInput.value.toLowerCase().trim();
    perfumeBlocks.forEach(block => {
        const text = block.map(el => el.textContent).join(' ').toLowerCase();
        const visible = query === '' || text.includes(query);
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
    })
    .catch(error => {
        document.getElementById('intro-content').innerHTML = '<p>Niente, non si è caricato. Riprova o vai a farti una vita.</p>';
    });
}

function loadGenderContent(gender) {
    currentGender = gender;
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
            if (el.tagName === 'P' && el.querySelector('strong')) {
                if (currentBlock.length > 0) {
                    perfumeBlocks.push(currentBlock);
                }
                currentBlock = [el];
            } else if (currentBlock.length > 0 && (el.tagName === 'P' || el.tagName === 'IMG' || el.tagName === 'BR')) {
                currentBlock.push(el);
            } else if (el.tagName === 'H1' && currentBlock.length > 0) {
                perfumeBlocks.push(currentBlock);
                currentBlock = [];
            }
        }
        if (currentBlock.length > 0) {
            perfumeBlocks.push(currentBlock);
        }
        
        document.getElementById('perfume-content').scrollIntoView({ behavior: 'smooth' });
    })
    .catch(error => {
        document.getElementById('perfume-content').innerHTML = '<p>Niente, non si è caricato. Riprova o vai a farti una vita.</p>';
    });
}

loadIntro();