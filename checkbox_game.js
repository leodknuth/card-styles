    const COLUMNS = 18;
    const ROW_TEMPLATE = '<input type="checkbox"/>'.repeat( COLUMNS );

    const easy = {
      currentScore: 0,
      currentRow: 1,
      currentMultiplier: 1,

      // time in ms to swing pendulum from side to the other
      currentSpeed: 1000,

      // initial width of the pendulum
      currentWidth: 6
    }

    const hard = {
      ...easy,
      currentMultiplier: 3,
      currentSpeed: 600,
      currentWidth: 4
    }

    let currentSettings = easy;

    let game = document.querySelector( '.game' );
    let canvas = document.querySelector( '.game-canvas' );
    let status = document.querySelector( '.game-status' );
    let score = document.querySelector( '.game-score' );
    let modeButton = document.querySelector( '.mode' );
    let restartButton = document.querySelector( '.restart' );

    let rows;
    let rowHeight;
    let state;

    let startTime;

    window.onresize = resize;
    restartButton.onmousedown = reset;
    modeButton.onmousedown = toggleMode;
    document.onkeydown = event => {
      if( event.keyCode === 32 ) click( event );
      if( event.keyCode === 82 ) reset();
    }

    if( 'ontouchstart' in window ) {
      window.ontouchstart = click;
    }
    else {
      window.onmousedown = click;
    }

    build();
    reset();
    paint();

    function reset() {

      setState( 'playing' );

      rows.forEach( row => row.forEach( box => box.checked = false ) );

      startTime = Date.now();

      ({currentRow,
        currentSpeed,
        currentWidth,
        currentScore,
        currentMultiplier} = currentSettings)

      selectBoxes({
        row: 0,
        index: Math.floor( COLUMNS/2 - currentWidth/2 ),
        width: currentWidth
      });

      score.innerHTML = 'score <em>' + currentScore + '</em>';

    }

    function resize() {
      if( build() ) reset();
    }

    function click( event ) {

      if( !event.type.startsWith( 'key' ) && event.target.matches( 'a, button' ) ) return;

      event.preventDefault();

      if( state === 'playing' ) {
        step();
      }
      else {
        reset();
      }

    }

    function setState( value ) {

      state = value;

      if( state === 'playing' ) status.textContent = 'press space or tap';
      else if( state === 'won' ) status.textContent = 'you rock 🏅✌️🦄';
      else if( state === 'lost' ) status.textContent = 'checkmate 💥';

    }

    function toggleMode() {

      if( /easy/i.test( modeButton.textContent ) ) {
        currentSettings = hard;
        modeButton.textContent = 'hard';
      }
      else {
        currentSettings = easy;
        modeButton.textContent = 'easy';
      }

      reset();

    }

    function build() {

      let canvasHeight = canvas.offsetHeight;

      // only rebuild if the number of rows has changed
      if( typeof rowHeight === 'number' &&  rows.length === Math.floor( canvasHeight / rowHeight ) - 1 ) {
        return false;
      }

      rows = [];
      canvas.innerHTML = '';

      let firstRow = generateRow();
      rowHeight = firstRow.offsetHeight;

      Array( Math.floor( canvasHeight / rowHeight ) - 2 ).fill().map( generateRow );

      return true;

    }

    function generateRow() {

      let row = document.createElement( 'div' );
      row.className = 'row';
      row.innerHTML = ROW_TEMPLATE;
      canvas.appendChild( row );

      rows.unshift( Array.from( row.childNodes ) );

      return row;

    }

    function selectBoxes({ row = currentRow, index, width }) {

      rows[row].forEach( ( box, i ) => box.checked = i >= index && i <= index + width - 1 );

    }

    function step() {

      currentWidth = 0;

      // currentWidth = adjacent checked boxes on previous row
      rows[currentRow].forEach( ( box, i ) => {
        if( box.checked && rows[currentRow-1][i].checked ) {
          currentWidth += 1;
        }
      } );

      currentRow += 1;

      // score
      let multiplier = currentMultiplier * ( 1 + ( currentRow / rows.length ) );
      currentScore = Math.ceil( currentScore + currentWidth * multiplier );

      // :(
      if( currentWidth === 0 ) {
        setState( 'lost' );
      }
      // :)
      else if( currentRow >= rows.length ) {
        currentScore += 30 * multiplier;
        setState( 'won' );
      }

      score.innerHTML = 'score <em>' + currentScore + '</em>';

    }

    function paint() {

      if( state === 'playing' ) {

        let time = ( Date.now() - startTime ) % ( currentSpeed*2 );
        if( time > currentSpeed ) time = currentSpeed*2 - time;

        selectBoxes({
          index: Math.floor( time/currentSpeed * ( COLUMNS - currentWidth + 1 ) ),
          width: currentWidth
        });

      }

      requestAnimationFrame( paint );

    }
