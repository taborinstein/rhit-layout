export default class SAR extends React.Component {
    render() {
        return (
            <div className="sar">
                <div className="text">
                    <div>
                        {"SMASH".split("").map((x, i) => (
                            <div key={i} className="char">
                                {x}
                            </div>
                        ))}
                    </div>
                    <div>
                        {"@ROSE".split("").map((x,i) => (
                            <div key={i} className="char">
                                {x}
                            </div> // key so react shuts up
                        ))}
                    </div>
                </div>
                <div className="num">#{this.props.num || "0"}</div>
            </div>
        );
    }
}
