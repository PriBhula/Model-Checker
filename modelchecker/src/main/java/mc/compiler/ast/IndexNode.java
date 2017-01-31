package mc.compiler.ast;

import mc.util.Location;

public class IndexNode extends ASTNode {

	// fields
	private String variable;
	private ASTNode range;
	private ASTNode process;

	public IndexNode(String variable, ASTNode range, ASTNode process, Location location){
		super(location);
		this.variable = variable;
		this.range = range;
        this.process = process;
	}

	public String getVariable(){
		return variable;
	}

	public ASTNode getRange(){
		return range;
	}

	public ASTNode getProcess(){
		return process;
	}

    public void setProcess(ASTNode process){
        this.process = process;
    }

    public boolean equals(Object obj){
        if(obj == this){
            return true;
        }
        if(obj == null){
            return false;
        }
        if(obj instanceof IndexNode){
            IndexNode node = (IndexNode)obj;
            if(!variable.equals(node.getVariable())){
                return false;
            }
            if(!range.equals(node.getRange())){
                return false;
            }
            if(!process.equals(node.getProcess())){
                return false;
            }

            return true;
        }

        return false;
    }
}
