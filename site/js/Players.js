class Player {

    //saves id/bool representing if they can move
    constructor(id) {
        this.id = id;
        this.myTurn = false;
    }

    //used for sequencing; makes sure that only the person who's moving can move
    playerChanged(id) {
        if (id == this.id) {
            this.myTurn = true;
        } else {
            this.myTurn = false;
        }
    }

    //disables the player
    disable() {
        this.myTurn = false;
    }
}

class HumanPlayer extends Player {
    constructor(id, engine) {
        //
        document.querySelectorAll('.cell').forEach(cell => cell.addEventListener('click', (clickedCellEvent) => this.handleCellClick(clickedCellEvent)));
        super(id);

        this.engine = engine;
    }

    //
    handleCellClick(clickedCellEvent) {
        const clickedCell = clickedCellEvent.target;
        const clickedCellIndex = parseInt(clickedCell.getAttribute('data-cell-index'));

        console.log("Processing cell click: " + clickedCellIndex);

        
        if (!this.engine.active) {
            //log that engine is inactive; leave function
            console.log("Engine is inactive, ignoring click")
            return;
        }
        
        if (!this.engine.isEmpty(clickedCellIndex)) {
            //log that cell is full; leave function
            console.log("Cell already used")
            return;
        }

        if (!this.myTurn) {
            //log that it isn't players turn; leave function
            console.log("Not my turn, ignoring click")
            return;
        }

        //if nothing's wrong, make the move.
        this.engine.makeMove(this.id, clickedCellIndex);

        //log that a move has been made
        console.log("Processed cell click: " + clickedCellIndex);
    }
}

class ChatbotPlayer extends Player {
    
    constructor(id, engine) {
        super(id);

        this.engine = engine;
        this.moveVotes = [0,0,0,0,0,0,0,0,0];
        this.mode = 0;

        //twitch client used for fetching data/speaking to the chat
        this.client = new tmi.client({
            //ensures
            connection: {
                secure: true,
                reconnect: true
            },
            //bot channel, bot auth token (used to validate session)
            identity:{
                username: 'programtest2',
                password: 'oauth:vtensnspxk74a49vlbjymrr76gsj7n'
            },

            //channel(s) for bot to connect to
            channels: ['cropsey']
        });

        //adds handlers to handle messages/connection to twitch
        //anonymous function handling the messages
        this.client.on('message', (channel,tags,message,self) => {
            $(this).trigger('message-received', tags.username + ": " + message);
            
            if (self) { return; }
        
            //all commands start with !, used to reduce time spent on non-commands
            if (!message.trim().startsWith('!')) {
                return;
            }
    
            //logs message received (command)
            console.log(message);
            console.log('message received');
    
            //splits message into multiple strings, which are seperated by spaces.
            const commandTrim = message.trim();
            const commandParameters = commandTrim.split(' ');
    
            //command name is the first
            //trim() used to remove all whitespace not removed by message.split
            const commandName = commandParameters[0];
            const commandNum = commandParameters[1];
            
            console.log("command split: " + commandName + " + " + commandNum + ", active = " + this.myTurn);
            
            //commands:
            // !vote - votes for move.
            // !votes - returns votes for a piece.
            // !toggle - toggles chat interaction.
            // !clearVotes - clears votes, resets votes to 0.
            switch (commandName) {
                case "!vote":
                    if (this.myTurn) {
                        console.log('Vote found for Move ' + commandNum);
                
                        //adds vote if in domain & is integer.
                        if (this.validMove(Number(commandNum))) {
                            if (this.mode == 0) {
                                engine.makeMove(id, commandNum);
                            } else {
                                this.moveVotes[commandNum]++;
                                console.log('Move ' + commandNum + ' was voted for, move now has ' + this.moveVotes[commandNum] + ' votes.');
                            }
                        }
                    }
                    return;
                case "!votes":
                    if (this.validMove(Number(commandNum))) {
                        this.client.say(channel, "Votes for " + commandNum + ": " + this.moveVotes[commandNum]);
                        console.log( 'Votes returned for piece ' + commandNum);
                    } 
                    return;
                case "!toggle":
                    this.toggleVoting();
                    console.log('Voting = ' + this.myTurn)
                    return;
                case "!clearvotes":
                    this.resetVotes();
                    console.log('Votes Reset!')
                    return;
                default:
                    console.log('No command with name ' + commandName);
            }

        });        
        
        //prints line on connection, useful for debug
        this.client.on('connected', (addr,port) => {
            console.log(`* Connected to ${addr}:${port}`);
        });

        this.connectClient();
    }

    //connects client to twitch
    connectClient() {
        this.client.connect()
    }
    
    //disconnects client from twitch
    disconnectClient() {
        this.client.disconnect()
    }

    //restarts client
    restartClient() {
        this.client.disconnect()
        this.client.connect()
    }

    //gets votes for a move
    getVotes() {
        return this.moveVotes;
    }

    votedMove() {
        let highestNum = 0;
        for (let i = 0; i < 9; i++) {
            if (this.moveVotes[i] > highestNum) {
                highestNum = this.moveVotes[i]
            }
        }
        return highestNum;
    }

    resetVotes() {
        this.moveVotes = [0,0,0,0,0,0,0,0,0];
    }

    toggleVoting() {
        this.myTurn = !this.myTurn
    }

    votingFunctional() {
        return this.myTurn
    }

    validMove(voteNum) {
        //checks type & contents
        if (voteNum == undefined || !Number.isInteger(voteNum)) {
            console.log("invalid move: not a integer. Input = " + voteNum);
            return false;
        }

        //checks if value provided is out of the domain
        if (this.engine.board[voteNum] != 0) {
            console.log("invalid move: not in domain. Number = " + voteNum);
            return false;
        }

        return true;
    }
}