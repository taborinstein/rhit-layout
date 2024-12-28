class Side extends React.Component {
    render() {
        return (
            <div className="side">
                <div className={`row${this.props.reversed ? " reversed" : ""}`}>
                    <div className="square" data-identifier="score">0</div>
                    <div className="icon" data-identifier="icon">
                        <img src="icons/chara_2_younglink_02.png" />
                    </div>
                    <div className="player_name">
                        <div data-identifier="prefix">ROSE</div>
                        <div data-identifier="name">Koko</div>
                    </div>
                    <div className="end flag" data-identifier="flag">
                        <div>
                            <img src="https://flags.komali.dev/svg/us-tn.svg" />
                        </div>
                    </div>
                </div>
                <div className={`row under${this.props.reversed ? " reversed" : ""}`}>
                    <div className="sep"></div>
                    <div className="widget" data-identifier="year">
                        Y2
                    </div>
                    <div className="widget" data-identifier="pronoun">
                        she/her
                    </div>
                    <div className="widget null" data-identifier="seed">
                    </div>
                    <div className="widget" data-identifier="social">
                        <img src="icons/internal/bsky.svg" />
                        <span style={{ fontFamily: "Arial", fontWeight: "bold" }}>@</span>
                        <span>koma.li</span>
                    </div>
                </div>
            </div>
        );
    }
}
export default Side;
