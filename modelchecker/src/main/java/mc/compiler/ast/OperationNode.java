package mc.compiler.ast;

import mc.util.Location;

public class OperationNode extends ASTNode {

	// fields
	private String operation;
	private boolean isNegated;
	private ASTNode firstProcess;
	private ASTNode secondProcess;

	public OperationNode(String operation, boolean isNegated, ASTNode firstProcess, ASTNode secondProcess, Location location){
		super(location);
		this.operation = operation;
		this.isNegated = isNegated;
		this.firstProcess = firstProcess;
		this.secondProcess = secondProcess;
	}

	public String getOperation(){
		return operation;
	}

	public boolean isNegated(){
		return isNegated;
	}

	public ASTNode getFirstProcess(){
		return firstProcess;
	}

    public void setFirstProcess(ASTNode firstProcess){
        this.firstProcess = firstProcess;
    }

	public ASTNode getSecondProcess(){
		return secondProcess;
	}

    public void setSecondProcess(ASTNode secondProcess){
        this.secondProcess = secondProcess;
    }

    public boolean equals(Object obj){
        if(obj == this){
            return true;
        }
        if(obj == null){
            return false;
        }
        if(obj instanceof OperationNode){
            OperationNode node = (OperationNode)obj;
            if(!operation.equals(node.getOperation())){
                return false;
            }
            if(isNegated != node.isNegated()){
                return false;
            }
            if(!firstProcess.equals(node.getFirstProcess())){
                return false;
            }
            if(!secondProcess.equals(node.getSecondProcess())){
                return false;
            }

            return true;
        }

        return false;
    }
}
